import React from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, IconButton, MD3Colors } from 'react-native-paper';
import { pickImage, takePhoto, pickDocument } from '../utils/filePicker';

export default function AttachmentUploader({ files = [], onFilesChange, maxFiles = 5, title = "附件" }) {
    const handleAdd = (newFiles) => {
        if (!onFilesChange) {
            console.error('AttachmentUploader: onFilesChange prop is required');
            return;
        }
        
        // 确保newFiles是数组
        const filesArray = Array.isArray(newFiles) ? newFiles : (newFiles ? [newFiles] : []);
        
        if (files.length + filesArray.length > maxFiles) {
            Alert.alert("提示", `最多只能上传 ${maxFiles} 个附件`);
            return;
        }
        onFilesChange([...files, ...filesArray]);
    };

    const handleRemove = (index) => {
        if (!onFilesChange) {
            console.error('AttachmentUploader: onFilesChange prop is required');
            return;
        }
        
        const updated = [...files];
        updated.splice(index, 1);
        onFilesChange(updated);
    };

    const renderPreview = (file, index) => {
        const isImage = file.type?.startsWith('image') || file.name?.match(/\.(jpg|jpeg|png|gif)$/i);

        return (
            <View key={index} style={styles.fileItem}>
                {isImage ? (
                    <Image source={{ uri: file.uri }} style={styles.thumbnail} />
                ) : (
                    <View style={styles.docIcon}>
                        <Text variant="labelLarge">DOC</Text>
                    </View>
                )}
                <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">{file.name}</Text>
                <IconButton
                    icon="close-circle"
                    iconColor={MD3Colors.error50}
                    size={20}
                    onPress={() => handleRemove(index)}
                    style={styles.removeBtn}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text variant="titleMedium">{title} ({files.length}/{maxFiles})</Text>
            </View>

            <View style={styles.buttonRow}>
                <Button
                    mode="outlined"
                    icon="camera"
                    onPress={async () => {
                        const file = await takePhoto();
                        if (file) handleAdd(file);
                    }}
                    disabled={files.length >= maxFiles}
                    style={styles.actionBtn}
                >
                    拍照
                </Button>
                <Button
                    mode="outlined"
                    icon="image"
                    onPress={async () => {
                        const file = await pickImage();
                        if (file) handleAdd(file);
                    }}
                    disabled={files.length >= maxFiles}
                    style={styles.actionBtn}
                >
                    相册
                </Button>
                <Button
                    mode="outlined"
                    icon="file-document"
                    onPress={async () => {
                        const file = await pickDocument();
                        if (file) handleAdd(file);
                    }}
                    disabled={files.length >= maxFiles}
                    style={styles.actionBtn}
                >
                    文件
                </Button>
            </View>

            <ScrollView horizontal style={styles.fileList} contentContainerStyle={styles.fileListContent}>
                {files.map((file, index) => renderPreview(file, index))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
        marginBottom: 8,
    },
    header: {
        marginBottom: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    actionBtn: {
        flex: 1,
    },
    fileList: {
        maxHeight: 120,
    },
    fileListContent: {
        paddingRight: 16,
    },
    fileItem: {
        width: 100,
        marginRight: 12,
        alignItems: 'center',
        position: 'relative',
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: '#eee',
    },
    docIcon: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 4,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    fileName: {
        fontSize: 12,
        color: '#666',
        width: '100%',
        textAlign: 'center',
    },
    removeBtn: {
        position: 'absolute',
        top: -10,
        right: 0,
        margin: 0,
    }
});
