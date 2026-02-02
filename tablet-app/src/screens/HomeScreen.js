// 首页Dashboard
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Surface, IconButton, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getPendingSyncCount, getDailyLogs, getWeeklyRecords, getMonthlyRecords, getImmediateEvents } from '../database/operations';

const menuItems = [
    { id: 'daily', title: '日检察', icon: '📅', color: '#409EFF', screen: 'DailyCheck', desc: '每日检察工作记录' },
    { id: 'weekly', title: '周检察', icon: '📆', color: '#67C23A', screen: 'WeeklyCheck', desc: '周检察工作记录' },
    { id: 'monthly', title: '月检察', icon: '📊', color: '#E6A23C', screen: 'MonthlyCheck', desc: '月检察工作记录' },
    { id: 'immediate', title: '及时检察', icon: '⚡', color: '#F56C6C', screen: 'ImmediateCheck', desc: '重大事件及时处理' },
    { id: 'history', title: '历史记录', icon: '📋', color: '#909399', screen: 'History', desc: '查看所有历史记录' },
    { id: 'sync', title: '同步导出', icon: '📤', color: '#9C27B0', screen: 'SyncExport', desc: '导出数据到电脑' },
];

export default function HomeScreen() {
    const navigation = useNavigation();
    const [syncCount, setSyncCount] = useState({ total: 0 });
    const [recentStats, setRecentStats] = useState({ daily: 0, weekly: 0, monthly: 0, immediate: 0 });

    useEffect(() => {
        loadStats();
        
        // 监听页面焦点，每次进入页面时刷新数据
        const unsubscribe = navigation.addListener('focus', () => {
            loadStats();
        });
        
        return unsubscribe;
    }, [navigation]);

    const loadStats = async () => {
        try {
            const count = await getPendingSyncCount();
            console.log('📊 待同步统计:', count);
            setSyncCount(count);

            const dailyLogs = await getDailyLogs(30);
            const weeklyRecords = await getWeeklyRecords(10);
            const monthlyRecords = await getMonthlyRecords(3);
            const immediateEvents = await getImmediateEvents(50);

            console.log('📈 记录统计:', {
                daily: dailyLogs.length,
                weekly: weeklyRecords.length,
                monthly: monthlyRecords.length,
                immediate: immediateEvents.length,
            });

            setRecentStats({
                daily: dailyLogs.length,
                weekly: weeklyRecords.length,
                monthly: monthlyRecords.length,
                immediate: immediateEvents.length,
            });
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    };

    const handleMenuPress = (screen) => {
        navigation.navigate(screen);
    };

    return (
        <ScrollView style={styles.container}>
            {/* 头部 */}
            <Surface style={styles.header} elevation={2}>
                <View style={styles.headerContent}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>江西省南昌长堎地区人民检察院</Text>
                        <Text style={styles.subtitle}>智慧派驻检察系统 - 平板端</Text>
                    </View>
                    <IconButton
                        icon="cog"
                        iconColor="#fff"
                        size={28}
                        onPress={() => navigation.navigate('Settings')}
                        style={styles.settingsButton}
                    />
                </View>
            </Surface>

            {/* 待同步提示 */}
            {syncCount.total > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('SyncExport')}>
                    <Card style={styles.syncAlert}>
                        <Card.Content style={styles.syncAlertContent}>
                            <Text style={styles.syncAlertIcon}>📤</Text>
                            <View style={styles.syncAlertText}>
                                <Text style={styles.syncAlertTitle}>有 {syncCount.total} 条待同步数据</Text>
                                <Text style={styles.syncAlertDesc}>点击导出同步到电脑</Text>
                            </View>
                            <Text style={{fontSize: 20, fontWeight: 'bold', color: '#F56C6C'}}>{syncCount.total}</Text>
                        </Card.Content>
                    </Card>
                </TouchableOpacity>
            )}

            {/* 统计卡片 */}
            <View style={styles.statsRow}>
                <Card style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                    <Card.Content>
                        <Text style={styles.statNumber}>{recentStats.daily}</Text>
                        <Text style={styles.statLabel}>日检察记录</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                    <Card.Content>
                        <Text style={styles.statNumber}>{recentStats.weekly}</Text>
                        <Text style={styles.statLabel}>周检察记录</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                    <Card.Content>
                        <Text style={styles.statNumber}>{recentStats.monthly}</Text>
                        <Text style={styles.statLabel}>月检察记录</Text>
                    </Card.Content>
                </Card>
                <Card style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                    <Card.Content>
                        <Text style={styles.statNumber}>{recentStats.immediate}</Text>
                        <Text style={styles.statLabel}>及时检察记录</Text>
                    </Card.Content>
                </Card>
            </View>

            {/* 功能菜单 */}
            <Text style={styles.sectionTitle}>功能菜单</Text>
            <View style={styles.menuGrid}>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.screen)}
                    >
                        <Card style={[styles.menuCard, { borderTopColor: item.color, borderTopWidth: 4 }]}>
                            <Card.Content style={styles.menuCardContent}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuDesc}>{item.desc}</Text>
                                {item.id === 'sync' && syncCount.total > 0 && (
                                    <View style={styles.menuBadge}>
                                        <Text style={{color: '#fff', fontSize: 12}}>{syncCount.total}</Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>
                    </TouchableOpacity>
                ))}
            </View>

            {/* 今日日期 */}
            <Text style={styles.dateText}>
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        padding: 24,
        backgroundColor: '#667eea',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    settingsButton: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    syncAlert: {
        margin: 16,
        backgroundColor: '#FEF3E2',
        borderLeftWidth: 4,
        borderLeftColor: '#E6A23C',
    },
    syncAlertContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncAlertIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    syncAlertText: {
        flex: 1,
    },
    syncAlertTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E6A23C',
    },
    syncAlertDesc: {
        fontSize: 12,
        color: '#909399',
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    statCard: {
        width: '48%',
        marginBottom: 12,
        marginHorizontal: '1%',
        borderRadius: 12,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#303133',
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
        color: '#909399',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#303133',
        marginHorizontal: 16,
        marginTop: 24,
        marginBottom: 12,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
    },
    menuItem: {
        width: '50%',
        padding: 4,
    },
    menuCard: {
        borderRadius: 12,
    },
    menuCardContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    menuIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#303133',
    },
    menuDesc: {
        fontSize: 12,
        color: '#909399',
        marginTop: 4,
        textAlign: 'center',
    },
    menuBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#F56C6C',
    },
    dateText: {
        textAlign: 'center',
        color: '#909399',
        fontSize: 14,
        marginVertical: 24,
    },
});
