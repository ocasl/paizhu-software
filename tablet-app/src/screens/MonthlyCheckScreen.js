// 月检察页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, Switch, FAB, Chip, Divider, Button, IconButton } from 'react-native-paper';
import { DatePickerModal } from '../components/SimpleDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createMonthlyRecord, getMonthlyRecordById, updateMonthlyRecord, deleteMonthlyRecord, getMonthlyRecords, getSetting } from '../database/operations';
import AttachmentUploader from '../components/AttachmentUploader';
import { getLocalDateString, getLocalYearMonth } from '../utils/dateUtils';
import { saveAttachmentsLocally, deleteAttachment } from '../utils/localAttachmentManager';

const tabs = [
    { key: 'visit', label: '会见检察' },
    { key: 'meeting', label: '会议参加' },
    { key: 'punishment', label: '处分监督' },
    { key: 'position', label: '岗位统计' },
];

const meetingTypes = [
    { value: 'lifeSentence', label: '无期死缓评审会' },
    { value: 'parole', label: '减刑假释评审会' },
    { value: 'analysis', label: '犯情分析会' },
    { value: 'other', label: '其他会议' }
];

export default function MonthlyCheckScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const editId = route.params?.id;

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('visit');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showMeetingDatePicker, setShowMeetingDatePicker] = useState(false);
    
    // 视图模式: 'form' 新建/编辑, 'history' 历史记录
    const [viewMode, setViewMode] = useState('form');
    const [historyRecords, setHistoryRecords] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // 日志关联状态
    const [logExists, setLogExists] = useState(false);
    const [currentLogId, setCurrentLogId] = useState(null);

    const currentMonth = getLocalYearMonth(); // YYYY-MM

    const [formData, setFormData] = useState({
        record_month: currentMonth,
        record_date: getLocalDateString(),
        
        // 1. 会见检察
        visit_check: {
            checked: false,
            visitCount: 0,
            issuesFound: false,
            description: ''
        },
        
        // 2. 犯情分析会
        meeting: {
            participated: false,
            meetingType: 'analysis',
            count: 1,
            role: 'listener', // listener/speaker/advisor
            meetingDate: '',
            notes: ''
        },
        
        // 3. 处分监督
        punishment: {
            exists: false,
            recordCount: 0,
            confinementCount: 0,
            supervised: true,
            evidenceUploaded: false,
            reason: '',
            evidenceFiles: []
        },
        
        // 4. 勤杂岗位变动
        position_stats: {
            startCount: 0,
            endCount: 0,
            miscellaneousIncrease: 0,
            miscellaneousDecrease: 0,
            productionIncrease: 0,
            productionDecrease: 0,
            reason: ''
        },
        
        notes: '',
    });

    useEffect(() => {
        loadInitialData();
        checkLogExists(formData.record_date);
    }, []);

    const loadInitialData = async () => {
        if (editId) {
            const record = await getMonthlyRecordById(editId);
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
            const records = await getMonthlyRecords(50, 0);
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
            `确定要清空全部 ${historyRecords.length} 条月检察记录吗？\n此操作不可恢复！`,
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
                                if (record.punishment?.evidenceFiles) {
                                    for (const attachment of record.punishment.evidenceFiles) {
                                        if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                    }
                                }
                                // 删除记录
                                await deleteMonthlyRecord(record.id);
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
            `确定要删除 ${record.record_month} 的月检察记录吗？\n删除后将无法恢复。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. 删除关联的附件文件
                            if (record.punishment?.evidenceFiles) {
                                for (const attachment of record.punishment.evidenceFiles) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            // 2. 删除数据库记录
                            await deleteMonthlyRecord(record.id);
                            
                            Alert.alert('成功', '月检察记录已删除');
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
            record_month: getLocalYearMonth(),
            record_date: getLocalDateString(),
            visit_check: {
                checked: false,
                visitCount: 0,
                issuesFound: false,
                description: ''
            },
            meeting: {
                participated: false,
                meetingType: 'analysis',
                count: 1,
                role: 'listener',
                meetingDate: '',
                notes: ''
            },
            punishment: {
                exists: false,
                recordCount: 0,
                confinementCount: 0,
                supervised: true,
                evidenceUploaded: false,
                reason: '',
                evidenceFiles: []
            },
            position_stats: {
                startCount: 0,
                endCount: 0,
                miscellaneousIncrease: 0,
                miscellaneousDecrease: 0,
                productionIncrease: 0,
                productionDecrease: 0,
                reason: ''
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

    // 格式化月检察数据为文本
    const formatMonthlyData = () => {
        const parts = [];

        if (formData.visit_check.checked) {
            parts.push(`✓ 会见检察: ${formData.visit_check.visitCount}次${formData.visit_check.issuesFound ? ',发现问题' : ''}`);
        }
        
        if (formData.meeting.participated) {
            const meetingTypeLabel = meetingTypes.find(t => t.value === formData.meeting.meetingType)?.label || '其他会议';
            parts.push(`✓ 参加会议: ${meetingTypeLabel} ${formData.meeting.count}次 (${formData.meeting.role === 'listener' ? '列席' : formData.meeting.role === 'speaker' ? '发言' : '提出意见'})`);
        }
        
        if (formData.punishment.exists) {
            parts.push(`✓ 处分监督: 记过${formData.punishment.recordCount}人,禁闭${formData.punishment.confinementCount}人${formData.punishment.supervised ? '(已监督)' : ''}`);
        }
        
        const totalIncrease = formData.position_stats.miscellaneousIncrease + formData.position_stats.productionIncrease;
        const totalDecrease = formData.position_stats.miscellaneousDecrease + formData.position_stats.productionDecrease;
        if (totalIncrease > 0 || totalDecrease > 0) {
            parts.push(`✓ 岗位变动: 新增${totalIncrease}人,减少${totalDecrease}人`);
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
                '该日期还没有日志记录，请先在PC端创建日志后再填写月检察',
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
                await updateMonthlyRecord(editId, dataToSave);
                recordId = editId;
                Alert.alert('成功', '月检察记录已更新');
            } else {
                const result = await createMonthlyRecord(dataToSave);
                recordId = result.id;
                Alert.alert('成功', '月检察记录已保存');
            }

            // 保存附件到本地（处分证据材料）
            try {
                if (formData.punishment.evidenceFiles?.length > 0) {
                    const savedAttachments = await saveAttachments(
                        recordId, 
                        formData.punishment.evidenceFiles, 
                        'monthly_punishment'
                    );
                    
                    if (savedAttachments.length > 0) {
                        console.log(`✅ 共保存 ${savedAttachments.length} 个附件到本地`);
                    }
                }
            } catch (saveError) {
                console.error('❌ 保存附件失败:', saveError);
                Alert.alert('提示', '记录已保存，但部分附件保存失败');
            }

            // 如果是从DailyCheck页面进入的,将数据同步回去
            if (route.params?.fromDaily) {
                const monthlyText = formatMonthlyData();
                navigation.navigate('DailyCheck', {
                    monthlyData: monthlyText,
                    syncType: 'monthly'
                });
            } else {
                navigation.goBack();
            }
        } catch (error) {
            Alert.alert('错误', '保存失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'visit':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="监狱会见场所检察" />
                        <Card.Content>
                            <TextInput
                                label="月份"
                                value={formData.record_month}
                                mode="outlined"
                                style={styles.input}
                                editable={false}
                                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                                onPressIn={() => setShowDatePicker(true)}
                            />

                            <View style={styles.switchRow}>
                                <Text>已检察会见场所</Text>
                                <Switch
                                    value={formData.visit_check.checked}
                                    onValueChange={(v) => updateField('visit_check', 'checked', v)}
                                />
                            </View>
                            {formData.visit_check.checked && (
                                <>
                                    <TextInput
                                        label="检察次数"
                                        value={String(formData.visit_check.visitCount || 0)}
                                        onChangeText={(v) => updateField('visit_check', 'visitCount', parseInt(v) || 0)}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        style={styles.input}
                                    />

                                    <View style={styles.switchRow}>
                                        <Text>是否发现问题</Text>
                                        <Switch
                                            value={formData.visit_check.issuesFound}
                                            onValueChange={(v) => updateField('visit_check', 'issuesFound', v)}
                                        />
                                    </View>

                                    {formData.visit_check.issuesFound && (
                                        <TextInput
                                            label="问题描述"
                                            placeholder="详细描述发现的问题..."
                                            value={formData.visit_check.description}
                                            onChangeText={(v) => updateField('visit_check', 'description', v)}
                                            mode="outlined"
                                            multiline
                                            numberOfLines={3}
                                            style={styles.input}
                                        />
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            case 'meeting':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="参加监狱会议/活动" />
                        <Card.Content>
                            <View style={styles.switchRow}>
                                <Text>本月参加了会议/活动</Text>
                                <Switch
                                    value={formData.meeting.participated}
                                    onValueChange={(v) => updateField('meeting', 'participated', v)}
                                />
                            </View>
                            {formData.meeting.participated && (
                                <>
                                    <View style={styles.chipContainer}>
                                        {meetingTypes.map(type => (
                                            <Chip
                                                key={type.value}
                                                selected={formData.meeting.meetingType === type.value}
                                                onPress={() => updateField('meeting', 'meetingType', type.value)}
                                                style={styles.chip}
                                                mode="outlined"
                                                showSelectedOverlay
                                            >
                                                {type.label}
                                            </Chip>
                                        ))}
                                    </View>

                                    <TextInput
                                        label="参加次数"
                                        value={String(formData.meeting.count || 1)}
                                        onChangeText={(v) => updateField('meeting', 'count', parseInt(v) || 1)}
                                        mode="outlined"
                                        keyboardType="numeric"
                                        style={styles.input}
                                    />

                                    <Text style={styles.sectionTitle}>参会角色</Text>
                                    <View style={styles.chipContainer}>
                                        <Chip
                                            selected={formData.meeting.role === 'listener'}
                                            onPress={() => updateField('meeting', 'role', 'listener')}
                                            style={styles.chip}
                                            mode="outlined"
                                            showSelectedOverlay
                                        >
                                            列席
                                        </Chip>
                                        <Chip
                                            selected={formData.meeting.role === 'speaker'}
                                            onPress={() => updateField('meeting', 'role', 'speaker')}
                                            style={styles.chip}
                                            mode="outlined"
                                            showSelectedOverlay
                                        >
                                            发言
                                        </Chip>
                                        <Chip
                                            selected={formData.meeting.role === 'advisor'}
                                            onPress={() => updateField('meeting', 'role', 'advisor')}
                                            style={styles.chip}
                                            mode="outlined"
                                            showSelectedOverlay
                                        >
                                            提出意见
                                        </Chip>
                                    </View>

                                    <TextInput
                                        label="会议日期"
                                        value={formData.meeting.meetingDate || ''}
                                        mode="outlined"
                                        placeholder="YYYY-MM-DD"
                                        style={styles.input}
                                        editable={false}
                                        right={<TextInput.Icon icon="calendar" onPress={() => setShowMeetingDatePicker(true)} />}
                                        onPressIn={() => setShowMeetingDatePicker(true)}
                                    />

                                    <TextInput
                                        label="会议记录"
                                        placeholder="记录会议要点..."
                                        value={formData.meeting.notes}
                                        onChangeText={(v) => updateField('meeting', 'notes', v)}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={4}
                                        style={styles.input}
                                    />
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            case 'punishment':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="罪犯记过以上处分监督" />
                        <Card.Content>
                            <View style={styles.switchRow}>
                                <Text>本月是否存在记过以上处分</Text>
                                <Switch
                                    value={formData.punishment.exists}
                                    onValueChange={(v) => updateField('punishment', 'exists', v)}
                                />
                            </View>

                            {formData.punishment.exists && (
                                <>
                                    <View style={styles.row}>
                                        <TextInput
                                            label="记过人数"
                                            value={String(formData.punishment.recordCount || 0)}
                                            onChangeText={(v) => updateField('punishment', 'recordCount', parseInt(v) || 0)}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            style={[styles.input, styles.halfInput]}
                                        />
                                        <TextInput
                                            label="禁闭人数"
                                            value={String(formData.punishment.confinementCount || 0)}
                                            onChangeText={(v) => updateField('punishment', 'confinementCount', parseInt(v) || 0)}
                                            mode="outlined"
                                            keyboardType="numeric"
                                            style={[styles.input, styles.halfInput]}
                                        />
                                    </View>

                                    <View style={styles.switchRow}>
                                        <Text>是否监督到位</Text>
                                        <Switch
                                            value={formData.punishment.supervised}
                                            onValueChange={(v) => updateField('punishment', 'supervised', v)}
                                        />
                                    </View>

                                    <TextInput
                                        label="处分原因"
                                        placeholder="记录主要处分原因..."
                                        value={formData.punishment.reason || ''}
                                        onChangeText={(v) => updateField('punishment', 'reason', v)}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={3}
                                        style={styles.input}
                                    />

                                    <View style={styles.switchRow}>
                                        <Text>是否上传证据材料</Text>
                                        <Switch
                                            value={formData.punishment.evidenceUploaded}
                                            onValueChange={(v) => updateField('punishment', 'evidenceUploaded', v)}
                                        />
                                    </View>
                                    
                                    {formData.punishment.evidenceUploaded && (
                                        <AttachmentUploader
                                            files={formData.punishment.evidenceFiles || []}
                                            onFilesChange={files => updateField('punishment', 'evidenceFiles', files)}
                                            title="证据材料"
                                            maxFiles={10}
                                        />
                                    )}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                );
            case 'position':
                return (
                    <Card style={styles.card}>
                        <Card.Title title="狱内勤杂/辅助生产岗位罪犯增减情况" titleNumberOfLines={2} />
                        <Card.Content>
                            <Text style={styles.sectionTitle}>勤杂岗位</Text>
                            <View style={styles.row}>
                                <TextInput
                                    label="月初人数"
                                    value={String(formData.position_stats.startCount || 0)}
                                    onChangeText={(v) => {
                                        const startCount = parseInt(v) || 0;
                                        const endCount = formData.position_stats.endCount || 0;
                                        const increase = Math.max(0, endCount - startCount);
                                        const decrease = Math.max(0, startCount - endCount);
                                        updateField('position_stats', 'startCount', startCount);
                                        updateField('position_stats', 'miscellaneousIncrease', increase);
                                        updateField('position_stats', 'miscellaneousDecrease', decrease);
                                    }}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                />
                                <TextInput
                                    label="月末人数"
                                    value={String(formData.position_stats.endCount || 0)}
                                    onChangeText={(v) => {
                                        const endCount = parseInt(v) || 0;
                                        const startCount = formData.position_stats.startCount || 0;
                                        const increase = Math.max(0, endCount - startCount);
                                        const decrease = Math.max(0, startCount - endCount);
                                        updateField('position_stats', 'endCount', endCount);
                                        updateField('position_stats', 'miscellaneousIncrease', increase);
                                        updateField('position_stats', 'miscellaneousDecrease', decrease);
                                    }}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                />
                            </View>

                            <View style={styles.row}>
                                <TextInput
                                    label="新增"
                                    value={String(formData.position_stats.miscellaneousIncrease || 0)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                    left={<TextInput.Icon icon="plus" />}
                                    editable={false}
                                />
                                <TextInput
                                    label="减少"
                                    value={String(formData.position_stats.miscellaneousDecrease || 0)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                    left={<TextInput.Icon icon="minus" />}
                                    editable={false}
                                />
                            </View>

                            <Divider style={styles.divider} />

                            <Text style={styles.sectionTitle}>辅助生产岗位</Text>
                            <View style={styles.row}>
                                <TextInput
                                    label="新增"
                                    value={String(formData.position_stats.productionIncrease || 0)}
                                    onChangeText={(v) => updateField('position_stats', 'productionIncrease', parseInt(v) || 0)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                    left={<TextInput.Icon icon="plus" />}
                                />
                                <TextInput
                                    label="减少"
                                    value={String(formData.position_stats.productionDecrease || 0)}
                                    onChangeText={(v) => updateField('position_stats', 'productionDecrease', parseInt(v) || 0)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={[styles.input, styles.halfInput]}
                                    left={<TextInput.Icon icon="minus" />}
                                />
                            </View>

                            <TextInput
                                label="变动原因（选填）"
                                placeholder="说明岗位变动的主要原因..."
                                value={formData.position_stats.reason || ''}
                                onChangeText={(v) => updateField('position_stats', 'reason', v)}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                                style={styles.input}
                            />
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
                            title="历史月检察统计" 
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
                                            <Text style={styles.historyDate}>{record.record_month}</Text>
                                            <Text style={styles.historyInfo}>
                                                关联日期: {record.record_date}
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

            {/* 月份选择器 */}
            <DatePickerModal
                locale="zh"
                mode="single"
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                date={formData.record_month ? new Date(formData.record_month + '-01') : new Date()}
                onConfirm={(params) => {
                    setShowDatePicker(false);
                    if (params.date) {
                        const yearMonth = getLocalYearMonth(params.date);
                        updateField('record_month', null, yearMonth);
                    }
                }}
            />

            {/* 会议日期选择器 */}
            <DatePickerModal
                locale="zh"
                mode="single"
                visible={showMeetingDatePicker}
                onDismiss={() => setShowMeetingDatePicker(false)}
                date={formData.meeting.meetingDate ? new Date(formData.meeting.meetingDate) : new Date()}
                onConfirm={(params) => {
                    setShowMeetingDatePicker(false);
                    if (params.date) {
                        const dateStr = getLocalDateString(params.date);
                        updateField('meeting', 'meetingDate', dateStr);
                    }
                }}
            />
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
    row: { flexDirection: 'row' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#303133', marginBottom: 8, marginTop: 4 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    chip: { marginRight: 8, marginBottom: 8 },
    fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#E6A23C' },
    divider: { marginVertical: 12 },
    successText: { color: '#67C23A', fontSize: 13, marginTop: 4 },
    warningText: { color: '#E6A23C', fontSize: 13, marginTop: 4 },
});
