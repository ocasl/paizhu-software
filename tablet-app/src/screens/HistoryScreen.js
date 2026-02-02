// 历史记录页面
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, Alert } from 'react-native';
import { Text, Card, Chip, SegmentedButtons, IconButton, Searchbar, Portal, Modal, Divider, Button, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getDailyLogs, getWeeklyRecords, getMonthlyRecords, getImmediateEvents, updateDailyLog } from '../database/operations';

const tabs = [
    { value: 'daily', label: '日检察' },
    { value: 'weekly', label: '周检察' },
    { value: 'monthly', label: '月检察' },
    { value: 'immediate', label: '及时检察' },
];

export default function HistoryScreen() {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('daily');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);

    // 编辑Modal状态
    const [editVisible, setEditVisible] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [editForm, setEditForm] = useState({
        field1: '', // 派驻监所
        field2: '', // 派驻人员
        field3: '', // 日期
        field4: '', // 填写人
        field5: '', // 现场检察位置
        field6: '', // 严管新增
        field7: '', // 警戒具人数
        field8: '', // 收押/调出
        field9: '', // 检察监督情况
        field10: '', // 采纳反馈
        field11: '', // 其他监督(周检察+月检察)
        field12: '', // 其他反馈
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            let result = [];
            switch (activeTab) {
                case 'daily':
                    result = await getDailyLogs(100);
                    break;
                case 'weekly':
                    result = await getWeeklyRecords(50);
                    break;
                case 'monthly':
                    result = await getMonthlyRecords(24);
                    break;
                case 'immediate':
                    result = await getImmediateEvents(100);
                    break;
            }
            setData(result);
        } catch (error) {
            console.error('加载数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 格式化三大现场位置
    const formatSceneLocations = (threeScenes) => {
        if (!threeScenes) return '';
        const parts = [];
        if (threeScenes.labor?.checked && threeScenes.labor.locations?.length) {
            parts.push(`劳动现场:${threeScenes.labor.locations.join('、')}`);
        }
        if (threeScenes.living?.checked && threeScenes.living.locations?.length) {
            parts.push(`生活现场:${threeScenes.living.locations.join('、')}`);
        }
        if (threeScenes.study?.checked && threeScenes.study.locations?.length) {
            parts.push(`学习现场:${threeScenes.study.locations.join('、')}`);
        }
        return parts.join('\n');
    };

    // 打开编辑Modal
    const openEditModal = (log) => {
        setEditingLog(log);
        setEditForm({
            field1: log.prison_name || '',
            field2: log.inspector_name || '',
            field3: log.log_date || '',
            field4: log.inspector_name || '',
            field5: formatSceneLocations(log.three_scenes),
            field6: String(log.strict_control?.newCount || 0),
            field7: String(log.police_equipment?.count || 0),
            field8: `入:${log.admission?.inCount || 0}/出:${log.admission?.outCount || 0}`,
            field9: log.supervision_situation || '',
            field10: log.feedback_situation || '',
            field11: log.other_work?.supervisionSituation || '',
            field12: log.other_work?.feedbackSituation || '',
        });
        setEditVisible(true);
    };

    // 保存编辑
    const handleSaveEdit = async () => {
        if (!editingLog) return;

        try {
            // 解析收押/调出字段
            const admissionMatch = editForm.field8.match(/入:(\d+).*出:(\d+)/);
            const inCount = admissionMatch ? parseInt(admissionMatch[1]) : 0;
            const outCount = admissionMatch ? parseInt(admissionMatch[2]) : 0;

            const updateData = {
                prison_name: editForm.field1,
                inspector_name: editForm.field2,
                strict_control: { newCount: parseInt(editForm.field6) || 0 },
                police_equipment: { count: parseInt(editForm.field7) || 0 },
                admission: { inCount, outCount },
                supervision_situation: editForm.field9,
                feedback_situation: editForm.field10,
                other_work: {
                    supervisionSituation: editForm.field11,
                    feedbackSituation: editForm.field12
                }
            };

            await updateDailyLog(editingLog.id, updateData);
            Alert.alert('成功', '日志已更新');
            setEditVisible(false);
            loadData(); // 刷新列表
        } catch (error) {
            console.error('保存失败:', error);
            Alert.alert('错误', '保存失败');
        }
    };

    const getSyncStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#E6A23C';
            case 'exported': return '#67C23A';
            default: return '#909399';
        }
    };

    const renderDailyItem = ({ item }) => (
        <Card style={styles.card}>
            <TouchableOpacity onPress={() => { setSelectedLog(item); setDetailVisible(true); }}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text style={styles.dateText}>{item.log_date}</Text>
                        <View style={styles.cardActions}>
                            <Chip
                                compact
                                style={{ backgroundColor: getSyncStatusColor(item.syncStatus), marginRight: 8 }}
                                textStyle={{ color: '#fff', fontSize: 10 }}
                            >
                                {item.syncStatus === 'pending' ? '待同步' : '已同步'}
                            </Chip>
                            <IconButton
                                icon="pencil"
                                size={18}
                                onPress={() => openEditModal(item)}
                                style={styles.editButton}
                            />
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        {item.three_scenes?.labor?.checked && <Chip compact>劳动现场</Chip>}
                        {item.three_scenes?.living?.checked && <Chip compact>生活现场</Chip>}
                        {item.three_scenes?.study?.checked && <Chip compact>学习现场</Chip>}
                    </View>
                    {item.notes && <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>}
                </Card.Content>
            </TouchableOpacity>
        </Card>
    );

    const renderWeeklyItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{item.record_date} (第{item.week_number}周)</Text>
                    <Chip
                        compact
                        style={{ backgroundColor: getSyncStatusColor(item.syncStatus) }}
                        textStyle={{ color: '#fff', fontSize: 10 }}
                    >
                        {item.syncStatus === 'pending' ? '待同步' : '已同步'}
                    </Chip>
                </View>
                <View style={styles.statsRow}>
                    {item.hospital_check?.hospitalChecked && <Chip compact>医院检察</Chip>}
                    {item.hospital_check?.confinementChecked && <Chip compact>禁闭室检察</Chip>}
                    {item.injury_check?.count > 0 && <Chip compact>外伤{item.injury_check.count}人</Chip>}
                </View>
            </Card.Content>
        </Card>
    );

    const renderMonthlyItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{item.record_month}</Text>
                    <Chip
                        compact
                        style={{ backgroundColor: getSyncStatusColor(item.syncStatus) }}
                        textStyle={{ color: '#fff', fontSize: 10 }}
                    >
                        {item.syncStatus === 'pending' ? '待同步' : '已同步'}
                    </Chip>
                </View>
                <View style={styles.statsRow}>
                    {item.visit_check?.checked && <Chip compact>会见检察</Chip>}
                    {item.meeting?.participated && <Chip compact>参加会议</Chip>}
                </View>
            </Card.Content>
        </Card>
    );

    const renderImmediateItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{item.event_date}</Text>
                    <Chip compact style={{ backgroundColor: '#F56C6C' }} textStyle={{ color: '#fff' }}>
                        {item.event_type}
                    </Chip>
                </View>
                {item.description && <Text style={styles.notes} numberOfLines={2}>{item.description}</Text>}
            </Card.Content>
        </Card>
    );

    const renderItem = ({ item }) => {
        switch (activeTab) {
            case 'daily': return renderDailyItem({ item });
            case 'weekly': return renderWeeklyItem({ item });
            case 'monthly': return renderMonthlyItem({ item });
            case 'immediate': return renderImmediateItem({ item });
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            {/* 标签切换 */}
            <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                buttons={tabs}
                style={styles.tabs}
            />

            {/* 列表 */}
            <FlatList
                data={data}
                keyExtractor={(item) => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>暂无记录</Text>
                    </View>
                }
            />

            {/* 详情弹窗 */}
            <Portal>
                <Modal
                    visible={detailVisible}
                    onDismiss={() => setDetailVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <ScrollView style={styles.modalScroll}>
                        {selectedLog && (
                            <View style={styles.detailContent}>
                                <Text style={styles.modalTitle}>日志详情</Text>
                                <Divider style={styles.divider} />

                                {/* 基本信息 */}
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>基本信息</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>日期:</Text>
                                        <Text style={styles.value}>{selectedLog.log_date}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>派驻监所:</Text>
                                        <Text style={styles.value}>{selectedLog.prison_name || '-'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>派驻人员:</Text>
                                        <Text style={styles.value}>{selectedLog.inspector_name || '-'}</Text>
                                    </View>
                                </View>

                                {/* 三大现场 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>三大现场检察</Text>
                                    {selectedLog.three_scenes?.labor?.checked && (
                                        <View style={styles.sceneBlock}>
                                            <Text style={styles.sceneTitle}>劳动现场 ✓</Text>
                                            {selectedLog.three_scenes.labor.locations?.length > 0 && (
                                                <Text style={styles.sceneDetail}>
                                                    地点: {selectedLog.three_scenes.labor.locations.join('、')}
                                                </Text>
                                            )}
                                            {selectedLog.three_scenes.labor.issues && (
                                                <Text style={styles.sceneDetail}>
                                                    问题: {selectedLog.three_scenes.labor.issues}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                    {selectedLog.three_scenes?.living?.checked && (
                                        <View style={styles.sceneBlock}>
                                            <Text style={styles.sceneTitle}>生活现场 ✓</Text>
                                            {selectedLog.three_scenes.living.locations?.length > 0 && (
                                                <Text style={styles.sceneDetail}>
                                                    地点: {selectedLog.three_scenes.living.locations.join('、')}
                                                </Text>
                                            )}
                                            {selectedLog.three_scenes.living.issues && (
                                                <Text style={styles.sceneDetail}>
                                                    问题: {selectedLog.three_scenes.living.issues}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                    {selectedLog.three_scenes?.study?.checked && (
                                        <View style={styles.sceneBlock}>
                                            <Text style={styles.sceneTitle}>学习现场 ✓</Text>
                                            {selectedLog.three_scenes.study.locations?.length > 0 && (
                                                <Text style={styles.sceneDetail}>
                                                    地点: {selectedLog.three_scenes.study.locations.join('、')}
                                                </Text>
                                            )}
                                            {selectedLog.three_scenes.study.issues && (
                                                <Text style={styles.sceneDetail}>
                                                    问题: {selectedLog.three_scenes.study.issues}
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                    {!selectedLog.three_scenes?.labor?.checked &&
                                        !selectedLog.three_scenes?.living?.checked &&
                                        !selectedLog.three_scenes?.study?.checked && (
                                            <Text style={styles.value}>未检察</Text>
                                        )}
                                </View>

                                {/* 警戒具检察 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>警戒具检察</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>使用人数:</Text>
                                        <Text style={styles.value}>
                                            {selectedLog.police_equipment?.checked
                                                ? `${selectedLog.police_equipment.count || 0} 人`
                                                : '未检察'}
                                        </Text>
                                    </View>
                                    {selectedLog.police_equipment?.issues && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.label}>发现问题:</Text>
                                            <Text style={styles.value}>{selectedLog.police_equipment.issues}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* 监控抽查 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>监控抽查</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>抽查次数:</Text>
                                        <Text style={styles.value}>
                                            {selectedLog.monitor_check?.checked
                                                ? `${selectedLog.monitor_check.count || 0} 次`
                                                : '未抽查'}
                                        </Text>
                                    </View>
                                </View>

                                {/* 严管禁闭 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>严管禁闭检察</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>新增人数:</Text>
                                        <Text style={styles.value}>{selectedLog.strict_control?.newCount || 0} 人</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>当前总数:</Text>
                                        <Text style={styles.value}>{selectedLog.strict_control?.totalCount || 0} 人</Text>
                                    </View>
                                </View>

                                {/* 涉黑罪犯 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>涉黑罪犯情况</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>新增人数:</Text>
                                        <Text style={styles.value}>{selectedLog.gang_prisoners?.newCount || 0} 人</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>当前总数:</Text>
                                        <Text style={styles.value}>{selectedLog.gang_prisoners?.totalCount || 0} 人</Text>
                                    </View>
                                </View>

                                {/* 收押/调出 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>收押/调出数量</Text>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>收押人数:</Text>
                                        <Text style={styles.value}>{selectedLog.admission?.inCount || 0} 人</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.label}>调出人数:</Text>
                                        <Text style={styles.value}>{selectedLog.admission?.outCount || 0} 人</Text>
                                    </View>
                                </View>

                                {/* 检察监督情况 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>检察监督情况</Text>
                                    <Text style={styles.textContent}>
                                        {selectedLog.supervision_situation || '无'}
                                    </Text>
                                </View>

                                {/* 采纳反馈情况 */}
                                <Divider style={styles.divider} />
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>采纳反馈情况</Text>
                                    <Text style={styles.textContent}>
                                        {selectedLog.feedback_situation || '无'}
                                    </Text>
                                </View>

                                {/* 其他检察工作 */}
                                {selectedLog.other_work?.supervisionSituation && (
                                    <>
                                        <Divider style={styles.divider} />
                                        <View style={styles.section}>
                                            <Text style={styles.sectionTitle}>其他检察工作情况</Text>
                                            <Text style={styles.textContent}>
                                                {selectedLog.other_work.supervisionSituation}
                                            </Text>
                                            {selectedLog.other_work.feedbackSituation && (
                                                <>
                                                    <Text style={styles.subTitle}>采纳反馈:</Text>
                                                    <Text style={styles.textContent}>
                                                        {selectedLog.other_work.feedbackSituation}
                                                    </Text>
                                                </>
                                            )}
                                        </View>
                                    </>
                                )}

                                {/* 备注 */}
                                {selectedLog.notes && (
                                    <>
                                        <Divider style={styles.divider} />
                                        <View style={styles.section}>
                                            <Text style={styles.sectionTitle}>备注</Text>
                                            <Text style={styles.textContent}>{selectedLog.notes}</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* 底部按钮 */}
                    <View style={styles.modalFooter}>
                        <Button mode="outlined" onPress={() => setDetailVisible(false)} style={styles.modalButton}>
                            关闭
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setDetailVisible(false);
                                openEditModal(selectedLog);
                            }}
                            style={styles.modalButton}
                        >
                            编辑
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* 12字段编辑Modal */}
            <Portal>
                <Modal
                    visible={editVisible}
                    onDismiss={() => setEditVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <ScrollView style={styles.modalScroll}>
                        <View style={styles.detailContent}>
                            <Text style={styles.modalTitle}>编辑日志</Text>
                            <Divider style={styles.divider} />

                            {/* 基本信息 1-4 */}
                            <View style={styles.editRow}>
                                <TextInput
                                    label="1.派驻监所"
                                    value={editForm.field1}
                                    onChangeText={(text) => setEditForm({ ...editForm, field1: text })}
                                    mode="outlined"
                                    style={styles.editHalfInput}
                                />
                                <TextInput
                                    label="2.派驻人员"
                                    value={editForm.field2}
                                    onChangeText={(text) => setEditForm({ ...editForm, field2: text })}
                                    mode="outlined"
                                    style={styles.editHalfInput}
                                />
                            </View>

                            <View style={styles.editRow}>
                                <TextInput
                                    label="3.日期"
                                    value={editForm.field3}
                                    mode="outlined"
                                    disabled
                                    style={styles.editHalfInput}
                                />
                                <TextInput
                                    label="4.填写人"
                                    value={editForm.field4}
                                    onChangeText={(text) => setEditForm({ ...editForm, field4: text })}
                                    mode="outlined"
                                    style={styles.editHalfInput}
                                />
                            </View>

                            {/* 现场检察位置 5 */}
                            <TextInput
                                label="5.现场检察位置"
                                value={editForm.field5}
                                onChangeText={(text) => setEditForm({ ...editForm, field5: text })}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                                style={styles.editInput}
                            />

                            {/* 数值字段 6-8 */}
                            <View style={styles.editRow}>
                                <TextInput
                                    label="6.严管新增"
                                    value={editForm.field6}
                                    onChangeText={(text) => setEditForm({ ...editForm, field6: text })}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.editThirdInput}
                                />
                                <TextInput
                                    label="7.警戒具人数"
                                    value={editForm.field7}
                                    onChangeText={(text) => setEditForm({ ...editForm, field7: text })}
                                    mode="outlined"
                                    keyboardType="numeric"
                                    style={styles.editThirdInput}
                                />
                                <TextInput
                                    label="8.收押/调出"
                                    value={editForm.field8}
                                    onChangeText={(text) => setEditForm({ ...editForm, field8: text })}
                                    mode="outlined"
                                    placeholder="入:0/出:0"
                                    style={styles.editThirdInput}
                                />
                            </View>

                            {/* 检察监督情况 9 */}
                            <TextInput
                                label="9.检察监督情况"
                                value={editForm.field9}
                                onChangeText={(text) => setEditForm({ ...editForm, field9: text })}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                style={styles.editInput}
                            />

                            {/* 采纳反馈 10 */}
                            <TextInput
                                label="10.采纳反馈"
                                value={editForm.field10}
                                onChangeText={(text) => setEditForm({ ...editForm, field10: text })}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                                style={styles.editInput}
                            />

                            {/* 其他监督(周检察+月检察) 11 */}
                            <TextInput
                                label="11.其他监督(周检察、月检察)"
                                value={editForm.field11}
                                onChangeText={(text) => setEditForm({ ...editForm, field11: text })}
                                mode="outlined"
                                multiline
                                numberOfLines={3}
                                placeholder="周检察、月检察、及时检察等"
                                style={styles.editInput}
                            />

                            {/* 其他反馈 12 */}
                            <TextInput
                                label="12.其他反馈"
                                value={editForm.field12}
                                onChangeText={(text) => setEditForm({ ...editForm, field12: text })}
                                mode="outlined"
                                multiline
                                numberOfLines={2}
                                style={styles.editInput}
                            />
                        </View>
                    </ScrollView>

                    {/* 底部按钮 */}
                    <View style={styles.modalFooter}>
                        <Button mode="outlined" onPress={() => setEditVisible(false)} style={styles.modalButton}>
                            取消
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSaveEdit}
                            style={styles.modalButton}
                        >
                            保存
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    tabs: { margin: 16 },
    list: { padding: 16, paddingTop: 0 },
    card: { marginBottom: 12, borderRadius: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    editButton: { margin: 0, padding: 0 },
    dateText: { fontSize: 16, fontWeight: '600', color: '#303133' },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    notes: { marginTop: 8, color: '#606266', fontSize: 13 },
    empty: { alignItems: 'center', padding: 48 },
    emptyText: { color: '#909399', fontSize: 16 },

    // Modal styles
    modalContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 16,
        maxHeight: '90%',
        elevation: 5,
    },
    modalScroll: {
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#303133',
        padding: 16,
        paddingBottom: 8,
    },
    divider: {
        marginVertical: 8,
    },
    detailContent: {
        paddingBottom: 16,
    },

    // Section styles
    section: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#409EFF',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#606266',
        marginTop: 8,
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        alignItems: 'flex-start',
    },
    label: {
        fontSize: 14,
        color: '#606266',
        width: 100,
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#303133',
        flex: 1,
    },
    textContent: {
        fontSize: 14,
        color: '#303133',
        lineHeight: 20,
    },

    // Scene block styles
    sceneBlock: {
        backgroundColor: '#F0F9FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    sceneTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#409EFF',
        marginBottom: 4,
    },
    sceneDetail: {
        fontSize: 13,
        color: '#606266',
        marginTop: 2,
    },

    // Modal footer
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E4E7ED',
        gap: 12,
    },
    modalButton: {
        minWidth: 80,
    },

    // 编辑Modal样式
    editRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    editInput: {
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    editHalfInput: {
        flex: 1,
        backgroundColor: '#fff',
    },
    editThirdInput: {
        flex: 1,
        backgroundColor: '#fff',
    },
});
