// 及时检察页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, FAB, Chip, SegmentedButtons, Button, IconButton } from 'react-native-paper';
import { DatePickerModal } from '../components/SimpleDatePicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createImmediateEvent, getImmediateEventById, updateImmediateEvent, deleteImmediateEvent, getImmediateEvents } from '../database/operations';
import AttachmentUploader from '../components/AttachmentUploader';
import { getLocalDateString } from '../utils/dateUtils';
import { deleteAttachment } from '../utils/localAttachmentManager';

const eventTypes = [
    { value: 'escape', label: '脱逃事件', color: '#F56C6C' },
    { value: 'selfHarm', label: '自伤自杀', color: '#E6A23C' },
    { value: 'majorAccident', label: '重大事故', color: '#F56C6C' },
    { value: 'death', label: '罪犯死亡', color: '#909399' },
    { value: 'majorActivity', label: '重大监管活动', color: '#409EFF' },
    { value: 'policeDiscipline', label: '民警受处分', color: '#E6A23C' },
    { value: 'paroleRequest', label: '减刑假释提请', color: '#67C23A' },
];

const paroleStages = [
    { value: 'review', label: '审查阶段' },
    { value: 'publicize', label: '公示阶段' },
    { value: 'submitted', label: '已提交' },
    { value: 'approved', label: '已通过' }
];

export default function ImmediateCheckScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const editId = route.params?.id;
    
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // 视图模式: 'form' 新建/编辑, 'history' 历史记录
    const [viewMode, setViewMode] = useState('form');
    const [historyEvents, setHistoryEvents] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [formData, setFormData] = useState({
        event_date: getLocalDateString(),
        event_type: '',
        title: '',
        description: '',
        parole_data: { batch: '', count: 0, stage: '' },
        attachment_ids: [],
        status: 'pending',
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        if (editId) {
            const event = await getImmediateEventById(editId);
            if (event) {
                setFormData(event);
            }
        }
    };

    // 加载历史记录（从本地数据库）
    const loadHistoryEvents = async () => {
        setLoadingHistory(true);
        try {
            const events = await getImmediateEvents(50, 0);
            setHistoryEvents(events || []);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            Alert.alert('错误', '加载历史记录失败');
        } finally {
            setLoadingHistory(false);
        }
    };

    // 一键清空全部记录
    const clearAllEvents = async () => {
        Alert.alert(
            '确认清空',
            `确定要清空全部 ${historyEvents.length} 条及时检察记录吗？\n此操作不可恢复！`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '清空',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            let deletedCount = 0;
                            for (const event of historyEvents) {
                                // 删除附件
                                if (event.attachments) {
                                    for (const attachment of event.attachments) {
                                        if (attachment.file_path) await deleteAttachment(attachment.file_path);
                                    }
                                }
                                // 删除记录
                                await deleteImmediateEvent(event.id);
                                deletedCount++;
                            }
                            Alert.alert('成功', `已清空 ${deletedCount} 条记录`);
                            loadHistoryEvents();
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
    const editHistoryEvent = (event) => {
        setFormData(event);
        setViewMode('form');
        navigation.setParams({ id: event.id });
    };

    // 删除历史记录（本地删除）
    const deleteHistoryEvent = async (event) => {
        Alert.alert(
            '确认删除',
            `确定要删除 ${event.event_date} 的及时检察记录吗？\n删除后将无法恢复。`,
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. 删除关联的附件文件
                            if (event.attachments) {
                                for (const attachment of event.attachments) {
                                    if (attachment.file_path) {
                                        await deleteAttachment(attachment.file_path);
                                    }
                                }
                            }
                            
                            // 2. 删除数据库记录
                            await deleteImmediateEvent(event.id);
                            
                            Alert.alert('成功', '及时检察记录已删除');
                            loadHistoryEvents();
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
    const createNewEvent = () => {
        setFormData({
            event_date: getLocalDateString(),
            event_type: '',
            title: '',
            description: '',
            parole_data: { batch: '', count: 0, stage: '' },
            attachment_ids: [],
            status: 'pending',
        });
        navigation.setParams({ id: undefined });
        setViewMode('form');
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.event_type || !formData.title) {
            Alert.alert('提示', '请选择事件类型并填写标题');
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                await updateImmediateEvent(editId, formData);
                Alert.alert('成功', '及时检察记录已更新', [
                    {
                        text: '确定',
                        onPress: () => navigation.goBack()
                    }
                ]);
            } else {
                await createImmediateEvent(formData);
                Alert.alert('成功', '及时检察记录已保存', [
                    {
                        text: '确定',
                        onPress: () => navigation.goBack()
                    }
                ]);
            }
        } catch (error) {
            Alert.alert('错误', '保存失败: ' + error.message);
        } finally {
            setLoading(false);
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
                            loadHistoryEvents();
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
                            title="历史及时检察统计" 
                            subtitle={`共 ${historyEvents.length} 条记录`}
                        />
                        <Card.Content>
                            <Button 
                                mode="contained" 
                                onPress={clearAllEvents}
                                icon="delete-sweep"
                                buttonColor="#F56C6C"
                                style={{ marginBottom: 16 }}
                            >
                                一键清空全部记录
                            </Button>
                            
                            {loadingHistory ? (
                                <Text style={{ textAlign: 'center', padding: 20 }}>加载中...</Text>
                            ) : historyEvents.length === 0 ? (
                                <Text style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无历史记录</Text>
                            ) : (
                                historyEvents.map((event) => {
                                    const typeConfig = eventTypes.find(t => t.value === event.event_type) || eventTypes[0];
                                    return (
                                        <Card key={event.id} style={styles.historyCard}>
                                            <Card.Content>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                    <Chip 
                                                        style={{ backgroundColor: typeConfig.color + '20', marginRight: 8 }} 
                                                        textStyle={{ color: typeConfig.color, fontSize: 12 }} 
                                                        compact
                                                    >
                                                        {typeConfig.label}
                                                    </Chip>
                                                    <Text style={styles.historyDate}>{event.event_date}</Text>
                                                </View>
                                                <Text style={styles.historyTitle}>{event.title}</Text>
                                                {event.description && (
                                                    <Text style={styles.historyPreview} numberOfLines={2}>
                                                        {event.description}
                                                    </Text>
                                                )}
                                            </Card.Content>
                                        </Card>
                                    );
                                })
                            )}
                        </Card.Content>
                    </Card>
                </ScrollView>
            ) : (
                /* 表单视图 */
            <ScrollView style={styles.scrollView}>
                {/* 基本信息 */}
                <Card style={styles.card}>
                    <Card.Title title="基本信息" />
                    <Card.Content>
                        <TextInput
                            label="事件日期"
                            value={formData.event_date}
                            mode="outlined"
                            style={styles.input}
                            editable={false}
                            right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                            onPressIn={() => setShowDatePicker(true)}
                        />
                        <TextInput
                            label="事件标题"
                            placeholder="简要描述事件"
                            value={formData.title}
                            onChangeText={(v) => updateField('title', v)}
                            mode="outlined"
                            style={styles.input}
                        />
                    </Card.Content>
                </Card>

                {/* 事件类型 */}
                <Card style={styles.card}>
                    <Card.Title title="事件类型" />
                    <Card.Content>
                        <View style={styles.chipContainer}>
                            {eventTypes.map((type) => (
                                <Chip
                                    key={type.value}
                                    selected={formData.event_type === type.value}
                                    onPress={() => updateField('event_type', type.value)}
                                    style={[
                                        styles.chip,
                                        formData.event_type === type.value && { backgroundColor: type.color }
                                    ]}
                                    textStyle={formData.event_type === type.value ? { color: '#fff' } : {}}
                                >
                                    {type.label}
                                </Chip>
                            ))}
                        </View>
                    </Card.Content>
                </Card>

                {/* 事件描述 */}
                <Card style={styles.card}>
                    <Card.Title title="事件描述" />
                    <Card.Content>
                        <TextInput
                            placeholder="详细描述事件情况..."
                            value={formData.description}
                            onChangeText={(v) => updateField('description', v)}
                            mode="outlined"
                            multiline
                            numberOfLines={6}
                            style={styles.input}
                        />
                        <AttachmentUploader
                            files={formData.attachments}
                            onFilesChange={files => updateField('attachments', files)}
                            title="事件附件"
                        />
                    </Card.Content>
                </Card>

                {/* 减刑假释专用 */}
                {formData.event_type === 'paroleRequest' && (
                    <Card style={styles.card}>
                        <Card.Title title="减刑假释信息" />
                        <Card.Content>
                            <TextInput
                                label="批次"
                                placeholder="如：2024年第3批"
                                value={formData.parole_data?.batch || ''}
                                onChangeText={(v) => updateField('parole_data', { ...formData.parole_data, batch: v })}
                                mode="outlined"
                                style={styles.input}
                            />
                            <TextInput
                                label="数量"
                                value={String(formData.parole_data?.count || 0)}
                                onChangeText={(v) => updateField('parole_data', { ...formData.parole_data, count: parseInt(v) || 0 })}
                                mode="outlined"
                                keyboardType="numeric"
                                style={styles.input}
                            />

                            <Text style={styles.subLabel}>当前阶段</Text>
                            <View style={styles.chipContainer}>
                                {paroleStages.map((stage) => (
                                    <Chip
                                        key={stage.value}
                                        selected={formData.parole_data?.stage === stage.value}
                                        onPress={() => updateField('parole_data', { ...formData.parole_data, stage: stage.value })}
                                        style={styles.chip}
                                        mode="outlined"
                                        showSelectedOverlay
                                    >
                                        {stage.label}
                                    </Chip>
                                ))}
                            </View>
                        </Card.Content>
                    </Card>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
            )}

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
                date={formData.event_date ? new Date(formData.event_date) : new Date()}
                onConfirm={(params) => {
                    setShowDatePicker(false);
                    if (params.date) {
                        const dateStr = getLocalDateString(params.date);
                        updateField('event_date', dateStr);
                    }
                }}
            />
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
        alignItems: 'flex-start',
    },
    historyDate: {
        fontSize: 14,
        color: '#909399',
    },
    historyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#303133',
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
    scrollView: { flex: 1, padding: 16 },
    card: { marginBottom: 16, borderRadius: 12 },
    input: { marginBottom: 12, backgroundColor: '#fff' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { marginBottom: 8 },
    fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#F56C6C' },
});
