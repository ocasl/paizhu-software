// 周检察页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, FlatList } from 'react-native';
import { Text, Card, Button, TextInput, Switch, FAB, Divider, Portal, Dialog, RadioButton, Chip, List, IconButton } from 'react-native-paper';
import { DatePickerModal } from '../components/SimpleDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createWeeklyRecord, getWeeklyRecordById, updateWeeklyRecord, deleteWeeklyRecord, getWeeklyRecords, getSetting } from '../database/operations';
import AttachmentUploader from '../components/AttachmentUploader';
import { getLocalDateString } from '../utils/dateUtils';
import { saveAttachmentsLocally, deleteAttachment } from '../utils/localAttachmentManager';

const tabs = [
    { key: 'hospital', label: '医院/禁闭室' },
    { key: 'injury', label: '外伤检察' },
    { key: 'talk', label: '罪犯谈话' },
    { key: 'mailbox', label: '检察官信箱' },
    { key: 'contraband', label: '违禁品排查' },
];

const talkTypes = [
    { value: 'newPrisoner', label: '新入监罪犯', color: '#409EFF' },
    { value: 'release', label: '刑释前罪犯', color: '#67C23A' },
    { value: 'injury', label: '外伤罪犯', color: '#E6A23C' },
    { value: 'confinement', label: '禁闭罪犯', color: '#F56C6C' },
];

export default function WeeklyCheckScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const editId = route.params?.id;

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('hospital');
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // 视图模式: 'form' 新建/编辑, 'history' 历史记录
    const [viewMode, setViewMode] = useState('form');
    const [historyRecords, setHistoryRecords] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // 日志关联状态
    const [logExists, setLogExists] = useState(false);
    const [currentLogId, setCurrentLogId] = useState(null);

    // 谈话记录弹窗
    const [showTalkDialog, setShowTalkDialog] = useState(false);
    const [showTalkDatePicker, setShowTalkDatePicker] = useState(false);
    const [talkForm, setTalkForm] = useState({
        type: 'newPrisoner',
        prisonerName: '',
        prisonerId: '',
        date: getLocalDateString(),
        content: '',
        transcriptUploaded: false,
        attachments: []  // 添加附件数组
    });

    // 统一的周检察表单（符合数据库结构）
    const [formData, setFormData] = useState({
        record_date: getLocalDateString(),
        week_number: Math.ceil((new Date().getDate()) / 7),
        
        // 1. 医院禁闭室检察
        hospital_check: {
            checked: false,
            checkDate: getLocalDateString(),
            focusAreas: {
                policeEquipment: false,  // 警械使用
                strictControl: false,    // 严管适用
                confinement: false       // 禁闭适用
            },
            hasAnomalies: false,
            anomalyDescription: '',
            attachments: []
        },
        
        // 2. 外伤检察
        injury_check: {
            found: false,
            count: 0,
            verified: false,
            anomalyDescription: '',
            transcriptUploaded: false,
            attachments: []  // 添加附件数组
        },
        
        // 3. 谈话记录
        talk_records: [],
        
        // 4. 检察官信箱
        mailbox: {
            opened: false,
            openCount: 0,
            receivedCount: 0,
            valuableClues: false,
            clueDescription: '',
            materialsUploaded: false,
            attachments: []  // 添加附件字段
        },
        
        // 5. 违禁品检查
        contraband: {
            checked: false,
            found: false,
            foundCount: 0,
            involvedCount: 0,
            description: '',
            attachments: []  // 改为 attachments，与PC端一致
        },
        
        notes: ''
    });

    useEffect(() => {
        loadInitialData();
        checkLogExists(formData.record_date);
    }, []);

    const loadInitialData = async () => {
        if (editId) {
            const record = await getWeeklyRecordById(editId);
            if (record) {
                setFormData(record);
                checkLogExists(record.record_date);
            }
        }
    };

    // 加载历史记录（从本地数据库）
    const loadHistoryRecords = async () => {
        setLoadingHistory(true);
        try {
            const records = await getWeeklyRecords(50, 0);
            setHistoryRecords(records || []);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            Alert.alert('错误', '加载历史记录失败');
        } finally {
            setLoadingHistory(false);
        }
    };

    // 一键清空全部记录
    const clearAllRecords = async () => {
        Alert.alert(
            '确认清空',
            `确定要清空全部 ${historyRecords.length} 条周检察记录吗？\n此操作不可恢复！`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '清空',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            let deletedCount = 0;
                            for (const record of historyRecords) {
                                // 删除附件
                                if (record.hospital_check?.attachments) {
                                    for (const attachment of record.hospital_check.attachments) {
                                        if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                    }
                                }
                                if (record.injury_check?.attachments) {
                                    for (const attachment of record.injury_check.attachments) {
                                        if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                    }
                                }
                                if (record.mailbox?.attachments) {
                                    for (const attachment of record.mailbox.attachments) {
                                        if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                    }
                                }
                                if (record.contraband?.attachments) {
                                    for (const attachment of record.contraband.attachments) {
                                        if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                    }
                                }
                                if (record.talk_records) {
                                    for (const talk of record.talk_records) {
                                        if (talk.attachments) {
                                            for (const attachment of talk.attachments) {
                                                if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                            }
                                        }
                                    }
                                }
                                // 删除记录
                                await deleteWeeklyRecord(record.id);
                                deletedCount++;
                            }
                            Alert.alert('成功', `已清空 ${deletedCount} 条记录`);
                            loadHistoryRecords();
                        } catch (error) {
                            console.error('清空失败:', error);
                            Alert.alert('错误', '清空失败: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    // 编辑历史记录
    const editHistoryRecord = (record) => {
        setFormData(record);
        setViewMode('form');
        navigation.setParams({ id: record.id });
        checkLogExists(record.record_date);
    };

    // 删除历史记录（本地删除）
    const deleteHistoryRecord = async (record) => {
        Alert.alert(
            '确认删除',
            `确定要删除 ${record.record_date} 的周检察记录吗？\n删除后将无法恢复。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. 删除关联的附件文件
                            if (record.hospital_check?.attachments) {
                                for (const attachment of record.hospital_check.attachments) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            if (record.injury_check?.attachments) {
                                for (const attachment of record.injury_check.attachments) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            if (record.mailbox?.attachments) {
                                for (const attachment of record.mailbox.attachments) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            if (record.contraband?.attachments) {
                                for (const attachment of record.contraband.attachments) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            // 删除谈话记录的附件
                            if (record.talk_records) {
                                for (const talk of record.talk_records) {
                                    if (talk.attachments) {
                                        for (const attachment of talk.attachments) {
                                            if (attachment.file_path) {
                                                await deleteAttachment(attachment.file_path);
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // 2. 删除数据库记录
                            await deleteWeeklyRecord(record.id);
                            
                            Alert.alert('成功', '周检察记录已删除');
                            loadHistoryRecords();
                        } catch (error) {
                            console.error('删除失败:', error);
                            Alert.alert('错误', '删除失败: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    // 新建记录
    const createNewRecord = () => {
        setFormData({
            record_date: getLocalDateString(),
            week_number: Math.ceil((new Date().getDate()) / 7),
            hospital_check: {
                checked: false,
                checkDate: getLocalDateString(),
                focusAreas: {
                    policeEquipment: false,
                    strictControl: false,
                    confinement: false
                },
                hasAnomalies: false,
                anomalyDescription: '',
                attachments: []
            },
            injury_check: {
                found: false,
                count: 0,
                verified: false,
                anomalyDescription: '',
                transcriptUploaded: false,
                attachments: []
            },
            talk_records: [],
            mailbox: {
                opened: false,
                openCount: 0,
                receivedCount: 0,
                valuableClues: false,
                clueDescription: '',
                materialsUploaded: false,
                attachments: []
            },
            contraband: {
                checked: false,
                found: false,
                foundCount: 0,
                involvedCount: 0,
                description: '',
                attachments: []
            },
            notes: ''
        });
        navigation.setParams({ id: undefined });
        setViewMode('form');
    };

    // 检查日志是否存在
    const checkLogExists = async (date) => {
        if (!date) return;
        
        // 单机版：不需要检查后端服务器
        // 只检查本地数据库即可
        setLogExists(false);
        setCurrentLogId(null);
    };

    const updateField = (section, field, value) => {
        if (field) {
            setFormData(prev => ({
                ...prev,
                [section]: { ...prev[section], [field]: value },
            }));
        } else {
            setFormData(prev => ({ ...prev, [section]: value }));
        }
    };

    // 谈话记录操作
    const addTalkRecord = () => {
        if (!talkForm.prisonerName || !talkForm.content) {
            Alert.alert('提示', '请填写罪犯姓名和谈话内容');
            return;
        }

        const newRecord = {
            id: Date.now(),
            type: talkForm.type,
            prisonerName: talkForm.prisonerName,
            prisonerId: talkForm.prisonerId,
            date: talkForm.date,
            content: talkForm.content,
            transcriptUploaded: talkForm.transcriptUploaded,
            attachments: talkForm.attachments || [],  // 保存附件
            typeLabel: talkTypes.find(t => t.value === talkForm.type)?.label
        };

        setFormData(prev => ({
            ...prev,
            talk_records: [...prev.talk_records, newRecord],
        }));

        setTalkForm({
            type: 'newPrisoner',
            prisonerName: '',
            prisonerId: '',
            date: getLocalDateString(),
            content: '',
            transcriptUploaded: false,
            attachments: []  // 重置附件
        });
        setShowTalkDialog(false);
    };

    const removeTalkRecord = (id) => {
        setFormData(prev => ({
            ...prev,
            talk_records: prev.talk_records.filter(r => r.id !== id),
        }));
    };

    // 格式化周检察数据为文本
    const formatWeeklyData = () => {
        const parts = [];

        if (formData.hospital_check.checked) {
            const areas = [];
            if (formData.hospital_check.focusAreas.policeEquipment) areas.push('警械使用');
            if (formData.hospital_check.focusAreas.strictControl) areas.push('严管适用');
            if (formData.hospital_check.focusAreas.confinement) areas.push('禁闭适用');
            
            parts.push(`✓ 已检察医院/禁闭室 (${areas.join('、')})`);
            
            if (formData.hospital_check.hasAnomalies) {
                parts.push(`  异常: ${formData.hospital_check.anomalyDescription}`);
            }
        }
        
        if (formData.injury_check.found) {
            parts.push(`✓ 外伤检察: ${formData.injury_check.count}人次${formData.injury_check.verified ? '(已核实)' : ''}`);
            if (formData.injury_check.anomalyDescription) {
                parts.push(`  ${formData.injury_check.anomalyDescription}`);
            }
        }
        
        if (formData.talk_records.length > 0) {
            parts.push(`✓ 罪犯谈话: ${formData.talk_records.length}人次`);
        }
        
        if (formData.mailbox.opened) {
            parts.push(`✓ 检察官信箱: 开启${formData.mailbox.openCount}次,收到${formData.mailbox.receivedCount}封`);
            if (formData.mailbox.valuableClues) {
                parts.push(`  发现线索: ${formData.mailbox.clueDescription}`);
            }
        }
        
        if (formData.contraband.checked) {
            if (formData.contraband.found) {
                parts.push(`✓ 违禁品排查: 发现${formData.contraband.foundCount}次,涉及${formData.contraband.involvedCount}人`);
            } else {
                parts.push(`✓ 违禁品排查: 未发现`);
            }
        }

        return parts.join('\n');
    };

    // 保存附件到本地（平板端单机版）
    const saveAttachments = async (recordId, files, category) => {
        if (!files || files.length === 0) return [];
        
        try {
            // 使用记录日期作为附件日期
            const logDate = formData.record_date;
            
            console.log('📎 保存附件到本地:');
            console.log('  category:', category);
            console.log('  log_date:', logDate);
            console.log('  files:', files.length);
            
            // 保存到本地文件系统
            const savedAttachments = await saveAttachmentsLocally(files, category, logDate);
            
            console.log('✅ 附件已保存:', savedAttachments.length, '个文件');
            
            return savedAttachments;
        } catch (error) {
            console.error('❌ 保存附件失败:', error);
            throw error;
        }
    };

    const handleSave = async () => {
        // 检查日志是否存在
        if (!logExists) {
            Alert.alert(
                '提示',
                '该日期还没有日志记录，请先在PC端创建日志后再填写周检察',
                [{ text: '确定' }]
            );
            return;
        }

        setLoading(true);
        try {
            // 添加日志关联信息
            const dataToSave = {
                ...formData,
                log_id: currentLogId,
                log_date: formData.record_date
            };

            let recordId;
            if (editId) {
                await updateWeeklyRecord(editId, dataToSave);
                recordId = editId;
                Alert.alert('成功', '周检察记录已更新');
            } else {
                const result = await createWeeklyRecord(dataToSave);
                recordId = result.id;
                Alert.alert('成功', '周检察记录已保存');
            }

            // 保存附件到本地
            try {
                const savedAttachments = [];
                
                if (formData.hospital_check.attachments?.length > 0) {
                    const hospitalAttachments = await saveAttachments(
                        recordId, 
                        formData.hospital_check.attachments, 
                        'weekly_hospital'
                    );
                    savedAttachments.push(...hospitalAttachments);
                }
                
                if (formData.injury_check.attachments?.length > 0) {
                    const injuryAttachments = await saveAttachments(
                        recordId, 
                        formData.injury_check.attachments, 
                        'weekly_injury'
                    );
                    savedAttachments.push(...injuryAttachments);
                }
                
                if (formData.mailbox.attachments?.length > 0) {
                    const mailboxAttachments = await saveAttachments(
                        recordId, 
                        formData.mailbox.attachments, 
                        'weekly_mailbox'
                    );
                    savedAttachments.push(...mailboxAttachments);
                }
                
                if (formData.contraband.attachments?.length > 0) {
                    const contrabandAttachments = await saveAttachments(
                        recordId, 
                        formData.contraband.attachments,
                        'weekly_contraband'
                    );
                    savedAttachments.push(...contrabandAttachments);
                }
                
                if (savedAttachments.length > 0) {
                    console.log(`✅ 共保存 ${savedAttachments.length} 个附件到本地`);
                }
            } catch (saveError) {
                console.error('❌ 保存附件失败:', saveError);
                Alert.alert('提示', '记录已保存，但部分附件保存失败');
            }

            // 如果是从DailyCheck页面进入的,将数据同步回去
            if (route.params?.fromDaily) {
                const weeklyText = formatWeeklyData();
                navigation.navigate('DailyCheck', {
                    weeklyData: weeklyText,
                    syncType: 'weekly'
                });
            } else {
                navigation.goBack();
            }
        } catch (error) {
            console.error(error);
            Alert.alert('错误', '保存失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // 渲染各个Tab内容
    const renderTabContent = () => {
        switch (activeTab) {
            case 'hospital':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="医院/禁闭室检察" />
                        <Card.Content>
                            <TextInput
                                label="检察日期"
                                value={formData.record_date}
                                mode="outlined"
                                style={styles.input}
                                editable={false}
                                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                                onPressIn={() => setShowDatePicker(true)}
                            />

                            <View style={styles.switchRow}>
                                <Text>已检察医院/禁闭室</Text>
                                <Switch
                                    value={formData.hospital_check.checked}
                                    onValueChange={(v) => updateField('hospital_check', 'checked', v)}
                                />
                            </View>

                            {formData.hospital_check.checked && (
                                <>
                                    <Divider style={styles.divider} />
                                    <Text style={styles.sectionTitle}>检察重点</Text>
                                    
                                    <View style={styles.checkboxRow}>
                                        <Text>警械使用情况</Text>
                                        <Switch
                                            value={formData.hospital_check.focusAreas.policeEquipment}
                                            onValueChange={(v) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    hospital_check: {
                                                        ...prev.hospital_check,
                                                        focusAreas: {
                                                            ...prev.hospital_check.focusAreas,
                                                            policeEquipment: v
                                                        }
                                                    }
                                                }));
                                            }}
                                        />
                                    </View>
                                    
                                    <View style={styles.checkboxRow}>
                                        <Text>严管适用情况</Text>
                                        <Switch
                                            value={formData.hospital_check.focusAreas.strictControl}
                                            onValueChange={(v) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    hospital_check: {
                                                        ...prev.hospital_check,
                                                        focusAreas: {
                                                            ...prev.hospital_check.focusAreas,
                                                            strictControl: v
                                                        }
                                                    }
                                                }));
                                            }}
                                        />
                                    </View>
                                    
                                    <View style={styles.checkboxRow}>
                                        <Text>禁闭适用情况</Text>
                                        <Switch
                                            value={formData.hospital_check.focusAreas.confinement}
                                            onValueChange={(v) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    hospital_check: {
                                                        ...prev.hospital_check,
                                                        focusAreas: {
                                                            ...prev.hospital_check.focusAreas,
                                                            confinement: v
                                                        }
                                                    }
                                                }));
                                            }}
                                        />
                                    </View>

                                    <Divider style={styles.divider} />
                                    <Text style={styles.sectionTitle}>检察结果</Text>
                                    
                                    <View style={styles.switchRow}>
                                        <Text>是否发现异常</Text>
                                        <Switch
                                            value={formData.hospital_check.hasAnomalies}
                                            onValueChange={(v) => updateField('hospital_check', 'hasAnomalies', v)}
                                        />
                                    </View>
                                    
                                    {formData.hospital_check.hasAnomalies && (
                                        <TextInput
                                            label="异常说明"
                                            value={formData.hospital_check.anomalyDescription}
                                            onChangeText={(v) => updateField('hospital_check', 'anomalyDescription', v)}
                                            mode="outlined"
                                            multiline
                                            numberOfLines={3}
                                            style={styles.input}
                                            placeholder="请详细描述发现的异常情况..."
                                        />
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            
            case 'injury':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="外伤检察" subtitle="工伤除外" />
                        <Card.Content>
                            <View style={styles.switchRow}>
                                <Text>本周是否发现外伤</Text>
                                <Switch
                                    value={formData.injury_check.found}
                                    onValueChange={(v) => updateField('injury_check', 'found', v)}
                                />
                            </View>

                            {formData.injury_check.found && (
                                <>
                                    <TextInput
                                        label="外伤罪犯人次"
                                        value={String(formData.injury_check.count || 0)}
                                        onChangeText={(v) => updateField('injury_check', 'count', parseInt(v) || 0)}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        style={styles.input}
                                    />

                                    <View style={styles.switchRow}>
                                        <Text>是否逐一核实</Text>
                                        <Switch
                                            value={formData.injury_check.verified}
                                            onValueChange={(v) => updateField('injury_check', 'verified', v)}
                                        />
                                    </View>

                                    <TextInput
                                        label="外伤情况描述"
                                        value={formData.injury_check.anomalyDescription}
                                        onChangeText={(v) => updateField('injury_check', 'anomalyDescription', v)}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={4}
                                        style={styles.input}
                                        placeholder="描述发现的外伤情况，受伤原因、处理方式等..."
                                    />

                                    <View style={styles.switchRow}>
                                        <Text>是否上传谈话笔录</Text>
                                        <Switch
                                            value={formData.injury_check.transcriptUploaded}
                                            onValueChange={(v) => updateField('injury_check', 'transcriptUploaded', v)}
                                        />
                                    </View>

                                    {/* 外伤检察附件上传 */}
                                    <Divider style={styles.divider} />
                                    <Text style={styles.sectionTitle}>外伤照片/医疗报告</Text>
                                    <AttachmentUploader
                                        files={formData.injury_check.attachments || []}
                                        onFilesChange={(files) => updateField('injury_check', 'attachments', files)}
                                        category="weekly_injury"
                                        date={formData.record_date}
                                        acceptedTypes={['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                                        maxFiles={10}
                                    />
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            case 'talk':
                return (
                    <Card style={styles.card}>
                        <Card.Title
                            title="罪犯谈话记录"
                            right={(props) => <Button mode="contained-tonal" compact onPress={() => setShowTalkDialog(true)}>添加谈话</Button>}
                        />
                        <Card.Content>
                            {formData.talk_records.length === 0 ? (
                                <Text style={styles.emptyText}>暂无谈话记录</Text>
                            ) : (
                                formData.talk_records.map((record, index) => {
                                    const typeConfig = talkTypes.find(t => t.value === record.type) || talkTypes[0];
                                    return (
                                        <View key={record.id || index} style={styles.talkItem}>
                                            <View style={styles.talkHeader}>
                                                <View style={styles.row}>
                                                    <Chip style={{ backgroundColor: typeConfig.color + '20', marginRight: 8 }} textStyle={{ color: typeConfig.color, fontSize: 12 }} compact>{typeConfig.label}</Chip>
                                                    <Text style={styles.talkName}>{record.prisonerName}</Text>
                                                    {record.prisonerId ? <Text style={styles.talkId}>({record.prisonerId})</Text> : null}
                                                </View>
                                                <IconButton icon="delete" size={20} iconColor="#F56C6C" onPress={() => removeTalkRecord(record.id)} />
                                            </View>
                                            <Text style={styles.talkContent}>{record.content}</Text>
                                            {record.attachments?.length > 0 && <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>附件: {record.attachments.length}个</Text>}
                                            <Divider style={styles.itemDivider} />
                                        </View>
                                    );
                                })
                            )}
                        </Card.Content>
                    </Card>
                );
            case 'mailbox':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="检察官信箱" />
                        <Card.Content>
                            <View style={styles.switchRow}>
                                <Text>是否开启检察官信箱</Text>
                                <Switch
                                    value={formData.mailbox.opened}
                                    onValueChange={(v) => updateField('mailbox', 'opened', v)}
                                />
                            </View>

                            {formData.mailbox.opened && (
                                <>
                                    <View style={styles.row}>
                                        <TextInput
                                            label="开启次数"
                                            value={String(formData.mailbox.openCount || 0)}
                                            onChangeText={(v) => updateField('mailbox', 'openCount', parseInt(v) || 0)}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            style={[styles.input, styles.halfInput]}
                                            left={<TextInput.Icon icon="email-open" />}
                                        />
                                        <TextInput
                                            label="收到信件"
                                            value={String(formData.mailbox.receivedCount || 0)}
                                            onChangeText={(v) => updateField('mailbox', 'receivedCount', parseInt(v) || 0)}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            style={[styles.input, styles.halfInput]}
                                            left={<TextInput.Icon icon="email" />}
                                        />
                                    </View>

                                    <View style={styles.switchRow}>
                                        <Text>是否发现有价值线索</Text>
                                        <Switch
                                            value={formData.mailbox.valuableClues}
                                            onValueChange={(v) => updateField('mailbox', 'valuableClues', v)}
                                        />
                                    </View>

                                    {formData.mailbox.valuableClues && (
                                        <TextInput
                                            label="线索描述"
                                            placeholder="详细描述发现的有价值线索..."
                                            value={formData.mailbox.clueDescription}
                                            onChangeText={(v) => updateField('mailbox', 'clueDescription', v)}
                                            mode="outlined"
                                            multiline
                                            numberOfLines={3}
                                            style={styles.input}
                                        />
                                    )}

                                    <View style={styles.switchRow}>
                                        <Text>是否上传材料</Text>
                                        <Switch
                                            value={formData.mailbox.materialsUploaded}
                                            onValueChange={(v) => updateField('mailbox', 'materialsUploaded', v)}
                                        />
                                    </View>
                                    
                                    {formData.mailbox.materialsUploaded && (
                                        <>
                                            <Divider style={styles.divider} />
                                            <Text style={styles.sectionTitle}>线索材料/信件扫描件</Text>
                                            <AttachmentUploader
                                                files={formData.mailbox.attachments || []}
                                                onFilesChange={(files) => updateField('mailbox', 'attachments', files)}
                                                maxFiles={10}
                                                title="材料附件"
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            case 'contraband':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="违禁品排查" />
                        <Card.Content>
                            <View style={styles.switchRow}>
                                <Text>已进行违禁品排查</Text>
                                <Switch
                                    value={formData.contraband.checked}
                                    onValueChange={(v) => updateField('contraband', 'checked', v)}
                                />
                            </View>

                            {formData.contraband.checked && (
                                <>
                                    <View style={styles.switchRow}>
                                        <Text>是否发现违禁品</Text>
                                        <Switch
                                            value={formData.contraband.found}
                                            onValueChange={(v) => updateField('contraband', 'found', v)}
                                        />
                                    </View>

                                    {formData.contraband.found && (
                                        <>
                                            <View style={styles.row}>
                                                <TextInput
                                                    label="发现次数"
                                                    value={String(formData.contraband.foundCount || 0)}
                                                    onChangeText={(v) => updateField('contraband', 'foundCount', parseInt(v) || 0)}
                                                    mode="outlined"
                                                    keyboardType="numeric"
                                                    style={[styles.input, styles.halfInput]}
                                                />
                                                <TextInput
                                                    label="涉及人数"
                                                    value={String(formData.contraband.involvedCount || 0)}
                                                    onChangeText={(v) => updateField('contraband', 'involvedCount', parseInt(v) || 0)}
                                                    mode="outlined"
                                                    keyboardType="numeric"
                                                    style={[styles.input, styles.halfInput]}
                                                />
                                            </View>

                                            <TextInput
                                                label="情况描述"
                                                placeholder="详细描述发现的违禁品情况..."
                                                value={formData.contraband.description}
                                                onChangeText={(v) => updateField('contraband', 'description', v)}
                                                mode="outlined"
                                                multiline
                                                numberOfLines={3}
                                                style={styles.input}
                                            />

                                            <AttachmentUploader
                                                files={formData.contraband.attachments || []}  // 改为 attachments
                                                onFilesChange={files => updateField('contraband', 'attachments', files)}  // 改为 attachments
                                                title="违禁品照片"
                                            />
                                        </>
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* 顶部切换栏 */}
            <View style={styles.headerBar}>
                <View style={styles.tabButtons}>
                    <Button
                        mode={viewMode === 'form' ? 'contained' : 'outlined'}
                        onPress={() => setViewMode('form')}
                        style={styles.tabButton}
                    >
                        {editId ? '编辑记录' : '新建记录'}
                    </Button>
                    <Button
                        mode={viewMode === 'history' ? 'contained' : 'outlined'}
                        onPress={() => {
                            setViewMode('history');
                            loadHistoryRecords();
                        }}
                        style={styles.tabButton}
                    >
                        历史记录
                    </Button>
                </View>
            </View>

            {/* 历史记录视图 */}
            {viewMode === 'history' ? (
                <ScrollView style={styles.scrollView}>
                    <Card style={styles.card}>
                        <Card.Title 
                            title="历史周检察统计" 
                            subtitle={`共 ${historyRecords.length} 条记录`}
                        />
                        <Card.Content>
                            <Button 
                                mode="contained" 
                                onPress={clearAllRecords}
                                icon="delete-sweep"
                                buttonColor="#F56C6C"
                                style={{ marginBottom: 16 }}
                            >
                                一键清空全部记录
                            </Button>
                            
                            {loadingHistory ? (
                                <Text style={{ textAlign: 'center', padding: 20 }}>加载中...</Text>
                            ) : historyRecords.length === 0 ? (
                                <Text style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无历史记录</Text>
                            ) : (
                                historyRecords.map((record) => (
                                    <Card key={record.id} style={styles.historyCard}>
                                        <Card.Content>
                                            <Text style={styles.historyDate}>{record.record_date}</Text>
                                            <Text style={styles.historyInfo}>
                                                第{record.week_number}周
                                            </Text>
                                            {record.notes && (
                                                <Text style={styles.historyPreview} numberOfLines={2}>
                                                    {record.notes}
                                                </Text>
                                            )}
                                        </Card.Content>
                                    </Card>
                                ))
                            )}
                        </Card.Content>
                    </Card>
                </ScrollView>
            ) : (
                /* 表单视图 */
                <>
            {/* 关联日志卡片 */}
            <Card style={styles.logCard}>
                <Card.Content>
                    <TextInput
                        label="关联日志日期"
                        value={formData.record_date}
                        mode="outlined"
                        style={styles.input}
                        editable={false}
                        right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                        onPressIn={() => setShowDatePicker(true)}
                    />
                    
                    {logExists ? (
                        <Text style={styles.successText}>✓ 该日期已有日志记录</Text>
                    ) : (
                        <Text style={styles.warningText}>⚠ 该日期还没有日志记录，请先在PC端创建</Text>
                    )}
                </Card.Content>
            </Card>

            {/* Tabs Header */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map((tab) => (
                        <Chip
                            key={tab.key}
                            selected={activeTab === tab.key}
                            onPress={() => setActiveTab(tab.key)}
                            style={styles.tabChip}
                            mode="outlined"
                            showSelectedOverlay
                        >
                            {tab.label}
                        </Chip>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={styles.scrollView}>
                {renderTabContent()}
                <View style={{ height: 100 }} />
            </ScrollView>

            <FAB
                icon="content-save"
                label="保存"
                style={styles.fab}
                onPress={handleSave}
                loading={loading}
            />

            {/* 日期选择器 */}
            <DatePickerModal
                locale="zh"
                mode="single"
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                date={formData.record_date ? new Date(formData.record_date) : new Date()}
                onConfirm={(params) => {
                    setShowDatePicker(false);
                    if (params.date) {
                        const dateStr = getLocalDateString(params.date);
                        updateField('record_date', null, dateStr);
                        checkLogExists(dateStr);
                    }
                }}
            />

            {/* 谈话记录添加弹窗 */}
            <Portal>
                <Dialog visible={showTalkDialog} onDismiss={() => setShowTalkDialog(false)}>
                    <Dialog.Title>添加谈话记录</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogLabel}>谈话类型</Text>
                        <View style={styles.chipContainer}>
                            {talkTypes.map(type => (
                                <Chip
                                    key={type.value}
                                    selected={talkForm.type === type.value}
                                    onPress={() => setTalkForm({ ...talkForm, type: type.value })}
                                    style={styles.dialogChip}
                                    compact
                                >
                                    {type.label}
                                </Chip>
                            ))}
                        </View>

                        <View style={styles.row}>
                            <TextInput
                                label="罪犯姓名"
                                value={talkForm.prisonerName}
                                onChangeText={v => setTalkForm({ ...talkForm, prisonerName: v })}
                                mode="outlined"
                                style={[styles.input, styles.halfInput]}
                            />
                            <TextInput
                                label="编号"
                                value={talkForm.prisonerId}
                                onChangeText={v => setTalkForm({ ...talkForm, prisonerId: v })}
                                mode="outlined"
                                style={[styles.input, styles.halfInput]}
                            />
                        </View>

                        <TextInput
                            label="谈话日期"
                            value={talkForm.date}
                            mode="outlined"
                            placeholder="YYYY-MM-DD"
                            style={styles.input}
                            editable={false}
                            right={<TextInput.Icon icon="calendar" onPress={() => setShowTalkDatePicker(true)} />}
                            onPressIn={() => setShowTalkDatePicker(true)}
                        />

                        <TextInput
                            label="谈话内容"
                            value={talkForm.content}
                            onChangeText={v => setTalkForm({ ...talkForm, content: v })}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />

                        {/* 是否上传笔录开关 */}
                        <View style={styles.switchRow}>
                            <Text>是否上传谈话笔录</Text>
                            <Switch
                                value={talkForm.transcriptUploaded}
                                onValueChange={(v) => setTalkForm({ ...talkForm, transcriptUploaded: v })}
                            />
                        </View>

                        {/* 谈话笔录附件上传 */}
                        {talkForm.transcriptUploaded && (
                            <>
                                <Divider style={styles.divider} />
                                <Text style={styles.sectionTitle}>谈话笔录扫描件</Text>
                                <AttachmentUploader
                                    files={talkForm.attachments || []}
                                    onFilesChange={(files) => setTalkForm({ ...talkForm, attachments: files })}
                                    category="weekly_talk"
                                    date={talkForm.date}
                                    acceptedTypes={['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*']}
                                    maxFiles={5}
                                />
                            </>
                        )}
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowTalkDialog(false)}>取消</Button>
                        <Button onPress={addTalkRecord}>确定</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* 谈话日期选择器 */}
                <DatePickerModal
                    locale="zh"
                    mode="single"
                    visible={showTalkDatePicker}
                    onDismiss={() => setShowTalkDatePicker(false)}
                    date={talkForm.date ? new Date(talkForm.date) : new Date()}
                    onConfirm={(params) => {
                        setShowTalkDatePicker(false);
                        if (params.date) {
                            const dateStr = getLocalDateString(params.date);
                            setTalkForm({ ...talkForm, date: dateStr });
                        }
                    }}
                />
            </Portal>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    headerBar: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
    },
    tabButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    tabButton: {
        marginRight: 8,
    },
    historyCard: {
        marginBottom: 12,
        borderRadius: 8,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    historyDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#303133',
    },
    historyInfo: {
        fontSize: 14,
        color: '#909399',
        marginTop: 4,
    },
    historyActions: {
        flexDirection: 'row',
    },
    historyPreview: {
        marginTop: 8,
        fontSize: 14,
        color: '#606266',
        lineHeight: 20,
    },
    logCard: { margin: 16, marginBottom: 8, borderRadius: 12 },
    tabContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 8,
        elevation: 2,
    },
    tabChip: {
        marginHorizontal: 4,
    },
    scrollView: { flex: 1, padding: 16 },
    card: { marginBottom: 16, borderRadius: 12 },
    input: { marginBottom: 12, backgroundColor: '#fff' },
    halfInput: { flex: 1, marginRight: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
    fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#67C23A' },
    divider: { marginVertical: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#303133', marginBottom: 8, marginTop: 4 },
    emptyText: { textAlign: 'center', color: '#909399', marginVertical: 20 },
    talkItem: { marginBottom: 12 },
    talkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    talkName: { fontSize: 16, fontWeight: 'bold', marginRight: 4 },
    talkId: { fontSize: 14, color: '#909399' },
    talkContent: { marginTop: 4, color: '#606266', lineHeight: 20 },
    itemDivider: { marginTop: 12 },
    dialogLabel: { marginBottom: 8, color: '#606266' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    dialogChip: { marginRight: 8, marginBottom: 8 },
    successText: { color: '#67C23A', fontSize: 13, marginTop: 4 },
    warningText: { color: '#E6A23C', fontSize: 13, marginTop: 4 },
});
