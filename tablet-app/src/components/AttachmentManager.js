// 附件管理器组件 - 用于上传和管理附件
import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, Card, IconButton, Chip } from 'react-native-paper';
import { pickImage, pickDocument } from '../utils/filePicker';
import { saveAttachment } from '../database/operations';

/**
 * AttachmentManager - 附件管理组件
 * 
 * @param {Object} props
 * @param {Array} props.attachments - 当前附件列表 [{id, name, uri, type, size}]
 * @param {Function} props.onAttachmentsChange - 附件变化回调
 * @param {string} props.category - 附件分类 (daily-monitor, weekly-injury等)
 * @param {number} props.relatedLogId - 关联的检察记录ID
 * @param {string} props.relatedLogType - 检察记录类型 (daily/weekly/monthly/immediate)
 * @param {number} props.maxFiles - 最大文件数量
 * @param {string} props.title - 组件标题
 */
export default function AttachmentManager({
    attachments = [],
    onAttachmentsChange,
    category = 'other',
    relatedLogId = null,
    relatedLogType = null,
    maxFiles = 10,
    title = '附件'
}) {
    const [uploading, setUploading] = useState(false);

    // 选择图片
    const handlePickImage = async () => {
        if (attachments.length >= maxFiles) {
            Alert.alert('提示', `最多只能上传${maxFiles}个文件`);
            return;
        }

        try {
            const file = await pickImage();
            if (file) {
                await addAttachment(file, 'image');
            }
        } catch (error) {
            console.error('选择图片失败:', error);
            Alert.alert('错误', '选择图片失败');
        }
    };

    // 选择文档
    const handlePickDocument = async () => {
        if (attachments.length >= maxFiles) {
            Alert.alert('提示', `最多只能上传${maxFiles}个文件`);
            return;
        }

        try {
            const file = await pickDocument();
            if (file) {
                await addAttachment(file, 'document');
            }
        } catch (error) {
            console.error('选择文档失败:', error);
            Alert.alert('错误', '选择文档失败');
        }
    };

    // 添加附件
    const addAttachment = async (file, fileType) => {
        setUploading(true);
        try {
            // 保存到数据库
            const attachmentId = await saveAttachment({
                category,
                original_name: file.name,
                file_name: file.name,
                file_path: file.uri,
                file_size: file.size,
                mime_type: file.type || (fileType === 'image' ? 'image/jpeg' : 'application/pdf'),
                related_log_id: relatedLogId,
                related_log_type: relatedLogType,
                upload_month: new Date().toISOString().slice(0, 7)
            });

            // 添加到列表
            const newAttachment = {
                id: attachmentId,
                name: file.name,
                uri: file.uri,
                type: fileType,
                size: file.size,
                mimeType: file.type
            };

            const updated = [...attachments, newAttachment];
            onAttachmentsChange(updated);
        } catch (error) {
            console.error('保存附件失败:', error);
            Alert.alert('错误', '保存附件失败');
        } finally {
            setUploading(false);
        }
    };

    // 删除附件
    const removeAttachment = (index) => {
        Alert.alert(
            '确认删除',
            '确定要删除这个附件吗？',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '删除',
                    style: 'destructive',
                    onPress: () => {
                        const updated = attachments.filter((_, i) => i !== index);
                        onAttachmentsChange(updated);
                    }
                }
            ]
        );
    };

    // 格式化文件大小
    const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.count}>{attachments.length}/{maxFiles}</Text>
            </View>

            {/* 附件列表 */}
            {attachments.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.list}>
                    {attachments.map((attachment, index) => (
                        <Card key={index} style={styles.attachmentCard}>
                            <Card.Content style={styles.attachmentContent}>
                                {attachment.type === 'image' ? (
                                    <Image
                                        source={{ uri: attachment.uri }}
                                        style={styles.thumbnail}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.docIcon}>
                                        <Text style={styles.docIconText}>📄</Text>
                                    </View>
                                )}
                                <Text style={styles.fileName} numberOfLines={1}>
                                    {attachment.name}
                                </Text>
                                <Text style={styles.fileSize}>
                                    {formatSize(attachment.size)}
                                </Text>
                                <IconButton
                                    icon="close-circle"
                                    size={20}
                                    iconColor="#F56C6C"
                                    style={styles.deleteBtn}
                                    onPress={() => removeAttachment(index)}
                                />
                            </Card.Content>
                        </Card>
                    ))}
                </ScrollView>
            )}

            {/* 上传按钮 */}
            {attachments.length < maxFiles && (
                <View style={styles.actions}>
                    <Button
                        mode="outlined"
                        icon="image"
                        onPress={handlePickImage}
                        disabled={uploading}
                        style={styles.actionBtn}
                    >
                        添加图片
                    </Button>
                    <Button
                        mode="outlined"
                        icon="file-document"
                        onPress={handlePickDocument}
                        disabled={uploading}
                        style={styles.actionBtn}
                    >
                        添加文档
                    </Button>
                </View>
            )}

            {attachments.length === 0 && (
                <Text style={styles.emptyHint}>点击按钮添加附件</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#303133',
    },
    count: {
        fontSize: 12,
        color: '#909399',
    },
    list: {
        marginBottom: 12,
    },
    attachmentCard: {
        width: 120,
        marginRight: 8,
    },
    attachmentContent: {
        padding: 8,
        alignItems: 'center',
    },
    thumbnail: {
        width: 100,
        height: 100,
        borderRadius: 4,
        marginBottom: 4,
    },
    docIcon: {
        width: 100,
        height: 100,
        borderRadius: 4,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    docIconText: {
        fontSize: 40,
    },
    fileName: {
        fontSize: 12,
        color: '#303133',
        width: '100%',
        textAlign: 'center',
    },
    fileSize: {
        fontSize: 10,
        color: '#909399',
        marginTop: 2,
    },
    deleteBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        margin: 0,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
    },
    emptyHint: {
        textAlign: 'center',
        color: '#C0C4CC',
        fontSize: 12,
        marginTop: 8,
    },
});
