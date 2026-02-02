// 日检察页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Checkbox, Chip, Divider, FAB, Switch, Portal, Dialog, IconButton } from 'react-native-paper';
import { DatePickerModal } from '../components/SimpleDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';

import { createDailyLog, getDailyLogById, getDailyLogByDate, updateDailyLog, deleteDailyLog, getDailyLogs, getSetting } from '../database/operations';
import AttachmentUploader from '../components/AttachmentUploader';
import { getLocalDateString } from '../utils/dateUtils';
import { saveAttachmentsLocally, deleteAttachment } from '../utils/localAttachmentManager';

const scenesConfig = {
    labor: {
        key: 'labor',
        label: '劳动现场',
        color: '#409EFF',
        locations: ['生产车间', '习艺场所', '劳动工具存放区'],
        focusPoints: ['劳动安全防护', '劳动报酬发放', '超时超强度劳动', '违规使用危险工具'],
        goal: '保障劳动权益，防范生产安全事故，杜绝强迫劳动'
    },
    living: {
        key: 'living',
        label: '生活现场',
        color: '#67C23A',
        locations: ['监舍', '食堂', '医院', '洗漱卫生区'],
        focusPoints: ['居住条件达标', '饮食安全卫生', '医疗保障到位', '个人财物保管规范', '禁止体罚虐待'],
        goal: '维护基本生活与健康权益，排查自伤、斗殴等风险'
    },
    study: {
        key: 'study',
        label: '学习现场',
        color: '#E6A23C',
        locations: ['教室', '教育中心', '图书阅览室'],
        focusPoints: ['思想教育落实', '文化/职业技能培训开展', '教育时间保障', '学习内容合规性'],
        goal: '保障教育权益'
    }
};

export default function DailyCheckScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const editId = route.params?.id;

    // 视图模式: 'form' 新建/编辑, 'history' 历史记录
    const [viewMode, setViewMode] = useState('form');
    const [historyLogs, setHistoryLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [formData, setFormData] = useState({
        log_date: getLocalDateString(),
        prison_name: '',
        inspector_name: '',
        three_scenes: {
            labor: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
            living: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
            study: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
        },
        strict_control: { newCount: 0, totalCount: 0, notes: '' },
        police_equipment: { checked: false, count: 0, issues: '' },
        admission: { inCount: 0, outCount: 0 },
        monitor_check: { checked: false, count: 0, anomalies: [] },
        supervision_situation: '',
        feedback_situation: '',
        other_work: '',  // 简化为字符串，与PC端一致
        notes: '',
        attachments: []  // 添加通用附件字段，与PC端一致
    });

    const [showAnomalyDialog, setShowAnomalyDialog] = useState(false);
    const [anomalyForm, setAnomalyForm] = useState({ location: '', time: '', description: '', attachments: [] });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // 加载默认设置
            const prisonName = await getSetting('prisonName');
            const inspectorName = await getSetting('inspectorName');

            if (editId) {
                // 编辑模式
                const log = await getDailyLogById(editId);
                if (log) {
                    // 确保three_scenes结构完整
                    const mergedThreeScenes = {
                        labor: { ...formData.three_scenes.labor, ...log.three_scenes?.labor },
                        living: { ...formData.three_scenes.living, ...log.three_scenes?.living },
                        study: { ...formData.three_scenes.study, ...log.three_scenes?.study },
                    };
                    setFormData({ ...log, three_scenes: mergedThreeScenes });
                }
            } else {
                setFormData(prev => ({
                    ...prev,
                    prison_name: prisonName || '',
                    inspector_name: inspectorName || '',
                }));
            }
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    };

    // 加载历史记录（从本地数据库）
    const loadHistoryLogs = async () => {
        setLoadingHistory(true);
        try {
            const logs = await getDailyLogs(50, 0);
            setHistoryLogs(logs || []);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            Alert.alert('错误', '加载历史记录失败');
        } finally {
            setLoadingHistory(false);
        }
    };

    // 一键清空全部记录
    const clearAllLogs = async () => {
        Alert.alert(
            '确认清空',
            `确定要清空全部 ${historyLogs.length} 条日志记录吗？\n此操作不可恢复！`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '清空',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            let deletedCount = 0;
                            for (const log of historyLogs) {
                                // 删除附件
                                if (log.monitor_check?.anomalies) {
                                    for (const anomaly of log.monitor_check.anomalies) {
                                        if (anomaly.attachments) {
                                            for (const attachment of anomaly.attachments) {
                                                if (attachment.file_path) {
                                                    await deleteAttachment(attachment.file_path);
                                                }
                                            }
                                        }
                                    }
                                }
                                if (log.attachments) {
                                    for (const attachment of log.attachments) {
                                        if (attachment.file_path) {
                                            await deleteAttachment(attachment.file_path);
                                        }
                                    }
                                }
                                // 删除记录
                                await deleteDailyLog(log.id);
                                deletedCount++;
                            }
                            Alert.alert('成功', `已清空 ${deletedCount} 条记录`);
                            loadHistoryLogs();
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
    const editHistoryLog = (log) => {
        const mergedThreeScenes = {
            labor: { ...formData.three_scenes.labor, ...log.three_scenes?.labor },
            living: { ...formData.three_scenes.living, ...log.three_scenes?.living },
            study: { ...formData.three_scenes.study, ...log.three_scenes?.study },
        };
        setFormData({ ...log, three_scenes: mergedThreeScenes });
        setViewMode('form');
        navigation.setParams({ id: log.id });
    };

    // 删除历史记录（本地删除）
    const deleteHistoryLog = async (log) => {
        Alert.alert(
            '确认删除',
            `确定要删除 ${log.log_date} 的日志吗？\n删除后将无法恢复。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. 删除关联的附件文件
                            if (log.monitor_check?.anomalies) {
                                for (const anomaly of log.monitor_check.anomalies) {
                                    if (anomaly.attachments) {
                                        for (const attachment of anomaly.attachments) {
                                            if (attachment.file_path) {
                                                await deleteAttachment(attachment.file_path);
                                            }
                                        }
                                    }
                                }
                            }
                            
                            if (log.attachments) {
                                for (const attachment of log.attachments) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            // 2. 删除数据库记录
                            await deleteDailyLog(log.id);
                            
                            Alert.alert('成功', '日志已删除');
                            loadHistoryLogs();
                        } catch (error) {
                            console.error('删除失败:', error);
                            Alert.alert('错误', '删除失败: ' + error.message);
                        }
                    }
                }
            ]
        );
    };

    // 新建日志
    const createNewLog = () => {
        setFormData({
            log_date: getLocalDateString(),
            prison_name: formData.prison_name,
            inspector_name: formData.inspector_name,
            three_scenes: {
                labor: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
                living: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
                study: { checked: false, locations: [], focusPoints: [], issues: '', notes: '' },
            },
            strict_control: { newCount: 0, totalCount: 0, notes: '' },
            police_equipment: { checked: false, count: 0, issues: '' },
            admission: { inCount: 0, outCount: 0 },
            monitor_check: { checked: false, count: 0, anomalies: [] },
            supervision_situation: '',
            feedback_situation: '',
            other_work: '',
            notes: '',
            attachments: []
        });
        navigation.setParams({ id: undefined });
        setViewMode('form');
    };

    const updateThreeScene = (sceneKey, field, value) => {
        setFormData(prev => ({
            ...prev,
            three_scenes: {
                ...prev.three_scenes,
                [sceneKey]: {
                    ...prev.three_scenes[sceneKey],
                    [field]: value,
                },
            },
        }));
    };

    // Toggle item in array
    const toggleArrayItem = (sceneKey, field, item) => {
        const currentList = formData.three_scenes[sceneKey][field] || [];
        const newList = currentList.includes(item)
            ? currentList.filter(i => i !== item)
            : [...currentList, item];
        updateThreeScene(sceneKey, field, newList);
    };

    const updateField = (section, field, value) => {
        if (field) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value,
                },
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [section]: value,
            }));
        }
    };

    const addAnomaly = () => {
        if (!anomalyForm.location || !anomalyForm.description) {
            Alert.alert('提示', '请填写位置和描述');
            return;
        }
        const newAnomaly = { ...anomalyForm, id: Date.now() };
        const newAnomalies = [...(formData.monitor_check.anomalies || []), newAnomaly];
        updateField('monitor_check', 'anomalies', newAnomalies);
        setShowAnomalyDialog(false);
        setAnomalyForm({ location: '', time: '', description: '', attachments: [] });
    };

    const removeAnomaly = (index) => {
        const newAnomalies = [...formData.monitor_check.anomalies];
        newAnomalies.splice(index, 1);
        updateField('monitor_check', 'anomalies', newAnomalies);
    };

    const handleSave = async () => {
        if (!formData.log_date) {
            Alert.alert('提示', '请选择日期');
            return;
        }

        setLoading(true);
        try {
            let logId;
            if (editId) {
                await updateDailyLog(editId, formData);
                logId = editId;
                
                // 保存监控异常附件到本地
                await saveMonitorAnomalyAttachments(logId);
                
                Alert.alert('成功', '日志已更新', [
                    {
                        text: '确定',
                        onPress: () => {
                            navigation.navigate('Home', { refresh: true, timestamp: Date.now() });
                        }
                    }
                ]);
            } else {
                const result = await createDailyLog(formData);
                logId = result.id;
                
                // 保存监控异常附件到本地
                await saveMonitorAnomalyAttachments(logId);
                
                Alert.alert('成功', '日志已保存', [
                    {
                        text: '确定',
                        onPress: () => {
                            navigation.navigate('Home', { refresh: true, timestamp: Date.now() });
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('保存失败:', error);
            Alert.alert('错误', '保存失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // 保存监控异常附件到本地
    const saveMonitorAnomalyAttachments = async (logId) => {
        try {
            let totalSaved = 0;
            
            // 1. 保存监控异常附件
            if (formData.monitor_check.anomalies?.length > 0) {
                for (const anomaly of formData.monitor_check.anomalies) {
                    if (anomaly.attachments?.length > 0) {
                        const savedAttachments = await saveAttachmentsLocally(
                            anomaly.attachments,
                            'daily_log',
                            formData.log_date
                        );
                        totalSaved += savedAttachments.length;
                    }
                }
            }
            
            // 2. 保存通用附件（日志末尾的附件）
            if (formData.attachments?.length > 0) {
                const savedAttachments = await saveAttachmentsLocally(
                    formData.attachments,
                    'daily_log',
                    formData.log_date
                );
                totalSaved += savedAttachments.length;
            }
            
            if (totalSaved > 0) {
                console.log(`✅ 共保存 ${totalSaved} 个附件到本地`);
            }
        } catch (error) {
            console.error('❌ 保存附件失败:', error);
            // 不阻止日志保存，只记录错误
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
                        {editId ? '编辑日志' : '新建日志'}
                    </Button>
                    <Button
                        mode={viewMode === 'history' ? 'contained' : 'outlined'}
                        onPress={() => {
                            setViewMode('history');
                            loadHistoryLogs();
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
                            title="历史日志统计" 
                            subtitle={`共 ${historyLogs.length} 条记录`}
                        />
                        <Card.Content>
                            <Button 
                                mode="contained" 
                                onPress={clearAllLogs}
                                icon="delete-sweep"
                                buttonColor="#F56C6C"
                                style={{ marginBottom: 16 }}
                            >
                                一键清空全部记录
                            </Button>
                            
                            {loadingHistory ? (
                                <Text style={{ textAlign: 'center', padding: 20 }}>加载中...</Text>
                            ) : historyLogs.length === 0 ? (
                                <Text style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无历史记录</Text>
                            ) : (
                                historyLogs.map((log) => (
                                    <Card key={log.id} style={styles.historyCard}>
                                        <Card.Content>
                                            <Text style={styles.historyDate}>{log.log_date}</Text>
                                            <Text style={styles.historyInfo}>
                                                {log.prison_name} · {log.inspector_name}
                                            </Text>
                                            {log.supervision_situation && (
                                                <Text style={styles.historyPreview} numberOfLines={2}>
                                                    {log.supervision_situation}
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
                <ScrollView style={styles.scrollView}>
                {/* 1-4: 基本信息 */}
                <Card style={styles.card}>
                    <Card.Title title="基本信息 (1-4)" />
                    <Card.Content>
                        <TextInput
                            label="1.派驻监所"
                            value={formData.prison_name}
                            onChangeText={(v) => updateField('prison_name', null, v)}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="2.派驻人员"
                            value={formData.inspector_name}
                            onChangeText={(v) => updateField('inspector_name', null, v)}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="3.日期"
                            value={formData.log_date}
                            mode="outlined"
                            style={styles.input}
                            editable={false}
                            right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                            onPressIn={() => setShowDatePicker(true)}
                        />
                        <TextInput
                            label="4.填写人"
                            value={formData.inspector_name}
                            onChangeText={(v) => updateField('inspector_name', null, v)}
                            mode="outlined"
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* 5: 三大现场检察 */}
                <Card style={styles.card}>
                    <Card.Title title="5.三大现场检察" subtitle="现场检察地点位置" />
                    <Card.Content>
                        {Object.values(scenesConfig).map((scene) => (
                            <View key={scene.key} style={styles.sceneSection}>
                                <View style={styles.sceneHeader}>
                                    <Checkbox
                                        status={formData.three_scenes[scene.key].checked ? 'checked' : 'unchecked'}
                                        onPress={() => updateThreeScene(scene.key, 'checked', !formData.three_scenes[scene.key].checked)}
                                    />
                                    <Text style={[styles.sceneTitle, { color: scene.color }]}>{scene.label}</Text>
                                </View>

                                <Text style={styles.sceneGoal}>{scene.goal}</Text>

                                {formData.three_scenes[scene.key].checked && (
                                    <View style={styles.sceneContent}>
                                        <Text style={styles.subLabel}>检察地点</Text>
                                        <View style={styles.chipContainer}>
                                            {scene.locations.map((loc) => (
                                                <Chip
                                                    key={loc}
                                                    mode="outlined"
                                                    selected={formData.three_scenes[scene.key].locations?.includes(loc)}
                                                    onPress={() => toggleArrayItem(scene.key, 'locations', loc)}
                                                    style={styles.chip}
                                                >
                                                    {loc}
                                                </Chip>
                                            ))}
                                        </View>

                                        <Text style={styles.subLabel}>检察要点</Text>
                                        <View style={styles.chipContainer}>
                                            {scene.focusPoints.map((point) => (
                                                <Chip
                                                    key={point}
                                                    mode="outlined"
                                                    selected={formData.three_scenes[scene.key].focusPoints?.includes(point)}
                                                    onPress={() => toggleArrayItem(scene.key, 'focusPoints', point)}
                                                    style={styles.chip}
                                                >
                                                    {point}
                                                </Chip>
                                            ))}
                                        </View>

                                        <TextInput
                                            label="发现问题"
                                            value={formData.three_scenes[scene.key].issues || ''}
                                            onChangeText={(v) => updateThreeScene(scene.key, 'issues', v)}
                                            mode="outlined"
                                            multiline
                                            numberOfLines={2}
                                            style={styles.input}
                                        />

                                        <TextInput
                                            label="备注"
                                            value={formData.three_scenes[scene.key].notes || ''}
                                            onChangeText={(v) => updateThreeScene(scene.key, 'notes', v)}
                                            mode="outlined"
                                            style={styles.input}
                                        />
                                    </View>
                                )}
                                <Divider style={styles.divider} />
                            </View>
                        ))}
                    </Card.Content>
                </Card>

                {/* 6-8: 日工作事项数据 */}
                <Card style={styles.card}>
                    <Card.Title title="日工作事项数据 (6-8)" />
                    <Card.Content>
                        <View style={styles.row}>
                            <TextInput
                                label="6.严管新增"
                                value={String(formData.strict_control.newCount || 0)}
                                onChangeText={(v) => updateField('strict_control', 'newCount', parseInt(v) || 0)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, styles.halfInput]}
                            />
                            <TextInput
                                label="禁闭新增"
                                value={String(formData.strict_control.totalCount || 0)}
                                onChangeText={(v) => updateField('strict_control', 'totalCount', parseInt(v) || 0)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, styles.halfInput]}
                            />
                        </View>
                        <TextInput
                            label="7.警戒具新增人数"
                            value={String(formData.police_equipment.count || 0)}
                            onChangeText={(v) => updateField('police_equipment', 'count', parseInt(v) || 0)}
                            mode="outlined"
                            keyboardType="numeric"
                            style={styles.input}
                        />
                        <View style={styles.row}>
                            <TextInput
                                label="8.收押人数"
                                value={String(formData.admission.inCount || 0)}
                                onChangeText={(v) => updateField('admission', 'inCount', parseInt(v) || 0)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, styles.halfInput]}
                            />
                            <TextInput
                                label="调出人数"
                                value={String(formData.admission.outCount || 0)}
                                onChangeText={(v) => updateField('admission', 'outCount', parseInt(v) || 0)}
                                mode="outlined"
                                keyboardType="numeric"
                                style={[styles.input, styles.halfInput]}
                            />
                        </View>
                    </Card.Content>
                </Card>

                {/* 9. 监控抽查 */}
                <Card style={styles.card}>
                    <Card.Title title="9. 监控抽查" subtitle="监控视频抽查情况" />
                    <Card.Content>
                        <View style={styles.switchRow}>
                            <Text>是否进行监控抽查</Text>
                            <Switch
                                value={formData.monitor_check.checked}
                                onValueChange={(v) => updateField('monitor_check', 'checked', v)}
                            />
                        </View>

                        {formData.monitor_check.checked && (
                            <>
                                <TextInput
                                    label="抽查次数"
                                    value={String(formData.monitor_check.count || 0)}
                                    onChangeText={(v) => updateField('monitor_check', 'count', parseInt(v) || 0)}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.input}
                                />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <Text>监控异常记录 ({formData.monitor_check.anomalies?.length || 0}条)</Text>
                                    <Button
                                        mode="contained-tonal"
                                        compact
                                        onPress={() => setShowAnomalyDialog(true)}
                                    >
                                        添加异常
                                    </Button>
                                </View>

                                {formData.monitor_check.anomalies?.map((anomaly, index) => (
                                    <Card key={index} style={{ marginBottom: 8, backgroundColor: '#FFF3E0' }}>
                                        <Card.Content>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                                        {anomaly.location} {anomaly.time && `(${anomaly.time})`}
                                                    </Text>
                                                    <Text style={{ color: '#666' }}>{anomaly.description}</Text>
                                                    {anomaly.attachments?.length > 0 && (
                                                        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                                            附件: {anomaly.attachments.length}个
                                                        </Text>
                                                    )}
                                                </View>
                                                <IconButton
                                                    icon="delete"
                                                    size={20}
                                                    iconColor="#F56C6C"
                                                    onPress={() => removeAnomaly(index)}
                                                />
                                            </View>
                                        </Card.Content>
                                    </Card>
                                ))}
                            </>
                        )}
                    </Card.Content>
                </Card>

                {/* 10. 监督情况 */}
                <Card style={styles.card}>
                    <Card.Title title="10. 监督情况" subtitle="记录检察监督工作情况" />
                    <Card.Content>
                        <TextInput
                            label="监督情况"
                            value={formData.supervision_situation || ''}
                            onChangeText={(v) => updateField('supervision_situation', null, v)}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            placeholder="填写当日检察监督情况、发现的问题、提出的建议等..."
                        />
                    </Card.Content>
                </Card>

                {/* 11. 反馈情况 */}
                <Card style={styles.card}>
                    <Card.Title title="11. 反馈情况" subtitle="记录问题反馈和处理情况" />
                    <Card.Content>
                        <TextInput
                            label="反馈情况"
                            value={formData.feedback_situation || ''}
                            onChangeText={(v) => updateField('feedback_situation', null, v)}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            placeholder="填写监狱采纳反馈、整改落实等情况..."
                        />
                    </Card.Content>
                </Card>

                {/* 12. 其他工作 */}
                <Card style={styles.card}>
                    <Card.Title title="12. 其他工作" subtitle="记录其他检察工作（周检察、月检察等）" />
                    <Card.Content>
                        {/* 跳转按钮 */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            <Button
                                mode="contained"
                                buttonColor="#409EFF"
                                icon="calendar-week"
                                style={{ flex: 1 }}
                                onPress={() => navigation.navigate('WeeklyCheck')}
                            >
                                填写周检察
                            </Button>
                            <Button
                                mode="contained"
                                buttonColor="#67C23A"
                                icon="calendar-month"
                                style={{ flex: 1 }}
                                onPress={() => navigation.navigate('MonthlyCheck')}
                            >
                                填写月检察
                            </Button>
                        </View>
                        
                        <TextInput
                            label="其他工作"
                            value={formData.other_work || ''}
                            onChangeText={(v) => updateField('other_work', null, v)}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            placeholder="记录其他检察工作、特殊事项、临时任务等..."
                        />
                    </Card.Content>
                </Card>

                {/* 备注 */}
                <Card style={styles.card}>
                    <Card.Title title="备注" />
                    <Card.Content>
                        <TextInput
                            label="备注信息"
                            value={formData.notes || ''}
                            onChangeText={(v) => updateField('notes', null, v)}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            placeholder="其他需要说明的情况..."
                        />
                    </Card.Content>
                </Card>

                {/* 日检察附件（通用） */}
                <Card style={styles.card}>
                    <Card.Title title="日检察附件" subtitle="上传相关照片、文档等" />
                    <Card.Content>
                        <AttachmentUploader
                            files={formData.attachments || []}
                            onFilesChange={(files) => updateField('attachments', null, files)}
                            maxFiles={10}
                            title="附件"
                        />
                    </Card.Content>
                </Card>

                <View style={{ height: 100 }} />
            </ScrollView>
            )}

            {/* 保存按钮（仅表单模式显示） */}
            {viewMode === 'form' && (
                <FAB
                    icon="content-save"
                    label="保存"
                    style={styles.fab}
                    onPress={handleSave}
                    loading={loading}
                />
            )}

            {/* 日期选择器 */}
            <DatePickerModal
                locale="zh"
                mode="single"
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                date={formData.log_date ? new Date(formData.log_date) : new Date()}
                onConfirm={async (params) => {
                    setShowDatePicker(false);
                    if (params.date) {
                        const dateStr = getLocalDateString(params.date);

                        // 如果不是编辑模式,检查该日期是否已有日志数据
                        if (!editId) {
                            try {
                                const existingLog = await getDailyLogByDate(dateStr);
                                if (existingLog) {
                                    // 找到已有数据，提示用户
                                    Alert.alert(
                                        '日志已存在',
                                        `${dateStr} 的日志已经填写过了，是否要加载该日志进行编辑？`,
                                        [
                                            {
                                                text: '继续新建',
                                                onPress: () => {
                                                    // 只更新日期，不加载数据
                                                    updateField('log_date', null, dateStr);
                                                },
                                                style: 'cancel'
                                            },
                                            {
                                                text: '加载编辑',
                                                onPress: () => {
                                                    // 加载已有数据到表单
                                                    const mergedThreeScenes = {
                                                        labor: { ...formData.three_scenes.labor, ...existingLog.three_scenes?.labor },
                                                        living: { ...formData.three_scenes.living, ...existingLog.three_scenes?.living },
                                                        study: { ...formData.three_scenes.study, ...existingLog.three_scenes?.study },
                                                    };
                                                    setFormData({ ...existingLog, three_scenes: mergedThreeScenes });
                                                }
                                            }
                                        ]
                                    );
                                } else {
                                    // 没有数据,只更新日期
                                    updateField('log_date', null, dateStr);
                                }
                            } catch (error) {
                                console.error('加载日期数据失败:', error);
                                updateField('log_date', null, dateStr);
                            }
                        } else {
                            // 编辑模式下只更新日期
                            updateField('log_date', null, dateStr);
                        }
                    }
                }}
            />

            <Portal>
                <Dialog visible={showAnomalyDialog} onDismiss={() => setShowAnomalyDialog(false)}>
                    <Dialog.Title>添加监控异常</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="异常位置"
                            value={anomalyForm.location}
                            onChangeText={v => setAnomalyForm({ ...anomalyForm, location: v })}
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="发现时间"
                            value={anomalyForm.time}
                            onChangeText={v => setAnomalyForm({ ...anomalyForm, time: v })}
                            mode="outlined"
                            placeholder="例如：10:30"
                            style={styles.input}
                        />
                        <TextInput
                            label="异常描述"
                            value={anomalyForm.description}
                            onChangeText={v => setAnomalyForm({ ...anomalyForm, description: v })}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                        />
                        <AttachmentUploader
                            files={anomalyForm.attachments}
                            onFilesChange={files => setAnomalyForm({ ...anomalyForm, attachments: files })}
                            title="异常附件"
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setShowAnomalyDialog(false)}>取消</Button>
                        <Button onPress={addAnomaly}>确定</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E4E7ED',
    },
    tabButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    tabButton: {
        minWidth: 100,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
    },
    historyCard: {
        marginBottom: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#409EFF',
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
        marginBottom: 4,
    },
    historyInfo: {
        fontSize: 13,
        color: '#909399',
    },
    historyActions: {
        flexDirection: 'row',
    },
    historyPreview: {
        fontSize: 13,
        color: '#606266',
        marginTop: 8,
        lineHeight: 20,
    },
    input: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    halfInput: {
        flex: 1,
        marginRight: 8,
    },
    row: {
        flexDirection: 'row',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    sceneSection: {
        marginBottom: 8,
    },
    sceneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sceneTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    sceneGoal: {
        fontSize: 12,
        color: '#909399',
        marginLeft: 32,
        marginBottom: 8,
        fontStyle: 'italic',
    },
    sceneContent: {
        marginLeft: 32,
        marginTop: 8,
    },
    subLabel: {
        fontSize: 13,
        color: '#606266',
        marginBottom: 4,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    chip: {
        marginRight: 8,
        marginBottom: 8,
    },
    divider: {
        marginVertical: 8,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: '#667eea',
    },
});
