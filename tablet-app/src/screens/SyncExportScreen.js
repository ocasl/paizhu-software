// 同步导出页面 - 支持ZIP打包
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Text, Card, Button, ProgressBar, List, Divider, Surface } from 'react-native-paper';
import JSZip from 'jszip';
import { getPendingSyncData, getPendingSyncCount, markAsExported, getSetting } from '../database/operations';

const isWeb = Platform.OS === 'web';

export default function SyncExportScreen() {
    const [syncCount, setSyncCount] = useState({ total: 0 });
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [exportResult, setExportResult] = useState(null);

    useEffect(() => {
        loadSyncCount();
    }, []);

    const loadSyncCount = async () => {
        try {
            const count = await getPendingSyncCount();
            setSyncCount(count);
        } catch (error) {
            console.error('获取同步数量失败:', error);
        }
    };

    const handleExport = async () => {
        if (syncCount.total === 0) {
            if (isWeb) {
                alert('没有待同步的数据');
            } else {
                Alert.alert('提示', '没有待同步的数据');
            }
            return;
        }

        setExporting(true);
        setProgress(0);
        setProgressText('准备数据...');
        setExportResult(null);

        try {
            // 获取待同步数据
            setProgress(0.1);
            setProgressText('获取待同步数据...');
            const pendingData = await getPendingSyncData();

            // 获取用户设置
            const prisonName = await getSetting('prisonName') || '未设置';
            const inspectorName = await getSetting('inspectorName') || '未设置';

            setProgress(0.2);
            setProgressText('构建数据结构...');

            // 构建导出数据结构
            const exportData = {
                exportTime: new Date().toISOString(),
                prisonName,
                inspectorName,
                version: '1.0',
                tables: {
                    daily_logs: pendingData.daily_logs,
                    weekly_records: pendingData.weekly_records,
                    monthly_records: pendingData.monthly_records,
                    immediate_events: pendingData.immediate_events,
                    attachments: pendingData.attachments,
                },
                stats: {
                    daily: pendingData.daily_logs.length,
                    weekly: pendingData.weekly_records.length,
                    monthly: pendingData.monthly_records.length,
                    immediate: pendingData.immediate_events.length,
                    attachments: pendingData.attachments.length,
                }
            };

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const zipFileName = `sync_${timestamp}.zip`;

            setProgress(0.3);
            setProgressText('创建ZIP文件...');

            // 创建ZIP
            const zip = new JSZip();

            // 添加data.json
            zip.file('data.json', JSON.stringify(exportData, null, 2));

            // 添加manifest.json（元信息）
            const manifest = {
                version: '1.0',
                exportTime: exportData.exportTime,
                prisonName,
                inspectorName,
                stats: exportData.stats,
                platform: Platform.OS,
            };
            zip.file('manifest.json', JSON.stringify(manifest, null, 2));

            setProgress(0.5);
            setProgressText('处理附件...');

            // 处理附件
            let attachmentsCopied = 0;

            if (!isWeb && pendingData.attachments.length > 0) {
                // 原生模式：读取实际文件
                const FileSystem = await import('expo-file-system/legacy');
                const attachmentsFolder = zip.folder('attachments');

                for (const attachment of pendingData.attachments) {
                    if (attachment.file_path) {
                        try {
                            const fileInfo = await FileSystem.getInfoAsync(attachment.file_path);
                            if (fileInfo.exists) {
                                // 读取文件为base64
                                const fileContent = await FileSystem.readAsStringAsync(attachment.file_path, {
                                    encoding: FileSystem.EncodingType.Base64
                                });
                                attachmentsFolder.file(attachment.file_name, fileContent, { base64: true });
                                attachmentsCopied++;
                                setProgressText(`处理附件 ${attachmentsCopied}/${pendingData.attachments.length}...`);
                            }
                        } catch (e) {
                            console.warn('处理附件失败:', attachment.file_name, e);
                        }
                    }
                }
            }

            setProgress(0.8);
            setProgressText('生成ZIP文件...');

            if (isWeb) {
                // Web模式：生成Blob并下载
                const zipBlob = await zip.generateAsync({
                    type: 'blob',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                }, (metadata) => {
                    setProgress(0.8 + metadata.percent / 500); // 0.8 to 1.0
                });

                setProgress(0.95);
                setProgressText('保存文件...');

                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = zipFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // 原生模式：生成base64并保存到文件系统
                const zipBase64 = await zip.generateAsync({
                    type: 'base64',
                    compression: 'DEFLATE',
                    compressionOptions: { level: 6 }
                }, (metadata) => {
                    setProgress(0.8 + metadata.percent / 500); // 0.8 to 1.0
                });

                setProgress(0.95);
                setProgressText('保存文件...');

                const FileSystem = await import('expo-file-system/legacy');
                
                // 使用 Android 的公共 Downloads 目录
                // StorageAccessFramework.getUriForDirectoryInRoot 需要权限，我们用 cacheDirectory 中转
                const tempPath = `${FileSystem.cacheDirectory}${zipFileName}`;
                await FileSystem.writeAsStringAsync(tempPath, zipBase64, {
                    encoding: FileSystem.EncodingType.Base64
                });

                console.log('✅ ZIP文件已生成:', tempPath);

                // 使用 expo-sharing 分享文件，让用户选择保存位置
                const Sharing = await import('expo-sharing');
                const isAvailable = await Sharing.isAvailableAsync();
                
                if (isAvailable) {
                    await Sharing.shareAsync(tempPath, {
                        mimeType: 'application/zip',
                        dialogTitle: '保存ZIP文件',
                        UTI: 'public.zip-archive'
                    });
                    exportData.savedFilePath = '已通过分享保存';
                } else {
                    // 如果分享不可用，保存到应用目录
                    const exportDir = `${FileSystem.documentDirectory}exports/`;
                    const dirInfo = await FileSystem.getInfoAsync(exportDir);
                    if (!dirInfo.exists) {
                        await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
                    }
                    const filePath = `${exportDir}${zipFileName}`;
                    await FileSystem.copyAsync({
                        from: tempPath,
                        to: filePath
                    });
                    exportData.savedFilePath = filePath;
                }
                
                // 保存文件路径供后续显示
                exportData.savedFilePath = filePath;
            }

            setProgress(1);
            setProgressText('完成！');

            // 标记数据为已导出
            if (pendingData.daily_logs.length > 0) {
                await markAsExported('daily_logs', pendingData.daily_logs.map(r => r.id));
            }
            if (pendingData.weekly_records.length > 0) {
                await markAsExported('weekly_records', pendingData.weekly_records.map(r => r.id));
            }
            if (pendingData.monthly_records.length > 0) {
                await markAsExported('monthly_records', pendingData.monthly_records.map(r => r.id));
            }
            if (pendingData.immediate_events.length > 0) {
                await markAsExported('immediate_events', pendingData.immediate_events.map(r => r.id));
            }
            if (pendingData.attachments.length > 0) {
                await markAsExported('attachments', pendingData.attachments.map(r => r.id));
            }

            // 设置导出结果
            setExportResult({
                success: true,
                fileName: zipFileName,
                filePath: exportData.savedFilePath,
                stats: exportData.stats,
                attachmentsCopied,
            });

            // 刷新同步数量
            await loadSyncCount();

            if (isWeb) {
                alert(`导出成功！\n\nZIP文件 ${zipFileName} 已下载。\n包含：\n- ${exportData.stats.daily} 条日检察\n- ${exportData.stats.weekly} 条周检察\n- ${exportData.stats.monthly} 条月检察`);
            } else {
                Alert.alert(
                    '导出成功！', 
                    `ZIP文件：${zipFileName}\n\n包含 ${attachmentsCopied} 个附件文件。\n\n文件已通过系统分享功能保存，您可以选择保存到下载文件夹或其他位置。`,
                    [{ text: '确定' }]
                );
            }

        } catch (error) {
            console.error('导出失败:', error);
            setExportResult({ success: false, error: error.message });
            if (isWeb) {
                alert('导出失败: ' + error.message);
            } else {
                Alert.alert('导出失败', error.message);
            }
        } finally {
            setExporting(false);
            setProgressText('');
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* 待同步统计 */}
            <Card style={styles.card}>
                <Card.Title title="📊 待同步数据" />
                <Card.Content>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{syncCount.daily || 0}</Text>
                            <Text style={styles.statLabel}>日检察</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{syncCount.weekly || 0}</Text>
                            <Text style={styles.statLabel}>周检察</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{syncCount.monthly || 0}</Text>
                            <Text style={styles.statLabel}>月检察</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{syncCount.immediate || 0}</Text>
                            <Text style={styles.statLabel}>及时检察</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{syncCount.attachments || 0}</Text>
                            <Text style={styles.statLabel}>附件</Text>
                        </View>
                    </View>

                    <Surface style={styles.totalBox} elevation={1}>
                        <Text style={styles.totalNumber}>{syncCount.total || 0}</Text>
                        <Text style={styles.totalLabel}>条待同步数据</Text>
                    </Surface>
                </Card.Content>
            </Card>

            {/* 导出按钮 */}
            <Card style={styles.card}>
                <Card.Title title="📦 导出ZIP同步包" />
                <Card.Content>
                    {exporting && (
                        <View style={styles.progressContainer}>
                            <ProgressBar progress={progress} style={styles.progressBar} />
                            <Text style={styles.progressText}>{progressText || `${Math.round(progress * 100)}%`}</Text>
                        </View>
                    )}

                    <Button
                        mode="contained"
                        icon="folder-zip"
                        onPress={handleExport}
                        loading={exporting}
                        disabled={exporting || syncCount.total === 0}
                        style={styles.exportButton}
                        contentStyle={styles.exportButtonContent}
                    >
                        {exporting ? '正在打包...' : '导出ZIP同步包'}
                    </Button>

                    <Text style={styles.hint}>
                        ZIP包含：data.json（数据）+ attachments/（附件文件夹）
                    </Text>
                </Card.Content>
            </Card>

            {/* 导出结果 */}
            {exportResult && exportResult.success && (
                <Card style={[styles.card, styles.successCard]}>
                    <Card.Title title="✅ 导出成功" />
                    <Card.Content>
                        <List.Item
                            title="ZIP文件"
                            description={exportResult.fileName}
                            left={props => <List.Icon {...props} icon="folder-zip" />}
                        />
                        {exportResult.filePath && !isWeb && (
                            <List.Item
                                title="保存位置"
                                description={exportResult.filePath}
                                left={props => <List.Icon {...props} icon="folder" />}
                            />
                        )}
                        <Divider />
                        <List.Item
                            title="日检察"
                            description={`${exportResult.stats.daily} 条记录`}
                            left={props => <List.Icon {...props} icon="calendar" />}
                        />
                        <List.Item
                            title="周检察"
                            description={`${exportResult.stats.weekly} 条记录`}
                            left={props => <List.Icon {...props} icon="calendar-week" />}
                        />
                        <List.Item
                            title="月检察"
                            description={`${exportResult.stats.monthly} 条记录`}
                            left={props => <List.Icon {...props} icon="calendar-month" />}
                        />
                        <List.Item
                            title="附件文件"
                            description={`${exportResult.attachmentsCopied} 个文件`}
                            left={props => <List.Icon {...props} icon="attachment" />}
                        />
                    </Card.Content>
                </Card>
            )}

            {/* ZIP结构说明 */}
            <Card style={styles.card}>
                <Card.Title title="📁 ZIP包结构" />
                <Card.Content>
                    <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>
                            {`sync_2026-01-20.zip
├── data.json        ← 数据库记录
├── manifest.json    ← 导出信息
└── attachments/     ← 附件文件夹
    ├── photo_001.jpg
    ├── photo_002.jpg
    └── ...`}
                        </Text>
                    </View>
                </Card.Content>
            </Card>

            {/* 使用说明 */}
            <Card style={styles.card}>
                <Card.Title title="📖 使用说明" />
                <Card.Content>
                    <Text style={styles.instructionText}>
                        {isWeb ? (
                            `1. 点击"导出ZIP同步包"按钮\n2. 浏览器会自动下载ZIP文件\n3. 在网页端上传该ZIP文件即可导入`
                        ) : (
                            `1. 点击"导出ZIP同步包"按钮\n2. 用USB数据线连接平板和电脑\n3. 复制ZIP文件到电脑\n4. 在网页端上传ZIP文件导入`
                        )}
                    </Text>
                </Card.Content>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
    card: { marginBottom: 16, borderRadius: 12 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statItem: { alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#409EFF' },
    statLabel: { fontSize: 12, color: '#909399' },
    totalBox: { alignItems: 'center', padding: 20, borderRadius: 12, backgroundColor: '#667eea' },
    totalNumber: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
    totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    progressContainer: { marginBottom: 16 },
    progressBar: { height: 8, borderRadius: 4 },
    progressText: { textAlign: 'center', marginTop: 4, color: '#667eea', fontSize: 13 },
    exportButton: { backgroundColor: '#9C27B0' },
    exportButtonContent: { height: 56 },
    hint: { marginTop: 12, fontSize: 13, color: '#909399', textAlign: 'center' },
    successCard: { borderColor: '#67C23A', borderWidth: 2 },
    codeBlock: { backgroundColor: '#2d3748', padding: 16, borderRadius: 8 },
    codeText: { fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', lineHeight: 20 },
    instructionText: { lineHeight: 24, color: '#606266' },
});
