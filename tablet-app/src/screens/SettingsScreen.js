// 设置页面 - 配置平板默认信息
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, TextInput, Button, Divider } from 'react-native-paper';
import { getSetting, saveSetting } from '../database/operations';

export default function SettingsScreen({ navigation }) {
    const [prisonName, setPrisonName] = useState('');
    const [inspectorName, setInspectorName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    // 加载设置
    const loadSettings = async () => {
        try {
            const prison = await getSetting('prisonName');
            const inspector = await getSetting('inspectorName');
            setPrisonName(prison || '');
            setInspectorName(inspector || '');
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    };

    // 保存设置
    const handleSave = async () => {
        if (!prisonName.trim()) {
            Alert.alert('提示', '请输入派驻监所');
            return;
        }
        if (!inspectorName.trim()) {
            Alert.alert('提示', '请输入派驻人员');
            return;
        }

        setLoading(true);
        try {
            await saveSetting('prisonName', prisonName.trim());
            await saveSetting('inspectorName', inspectorName.trim());
            
            Alert.alert('成功', '设置已保存', [
                {
                    text: '确定',
                    onPress: () => navigation.goBack()
                }
            ]);
        } catch (error) {
            console.error('保存设置失败:', error);
            Alert.alert('错误', '保存失败: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title 
                    title="平板配置" 
                    subtitle="设置此平板的默认派驻信息"
                />
                <Card.Content>
                    <Text style={styles.description}>
                        配置后，新建日志时将自动填充这些信息
                    </Text>

                    <TextInput
                        label="派驻监所 *"
                        value={prisonName}
                        onChangeText={setPrisonName}
                        mode="outlined"
                        style={styles.input}
                        placeholder="例如：江西省某某监狱"
                    />

                    <TextInput
                        label="派驻人员 *"
                        value={inspectorName}
                        onChangeText={setInspectorName}
                        mode="outlined"
                        style={styles.input}
                        placeholder="例如：张三"
                    />

                    <Divider style={styles.divider} />

                    <Text style={styles.hint}>
                        💡 提示：这些信息会在新建日志、周检察、月检察时自动填充
                    </Text>
                </Card.Content>
            </Card>

            <View style={styles.buttonContainer}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    disabled={loading}
                    style={styles.saveButton}
                >
                    保存设置
                </Button>
                
                <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                    style={styles.cancelButton}
                >
                    取消
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    card: {
        margin: 16,
        elevation: 2,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    input: {
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    hint: {
        fontSize: 13,
        color: '#909399',
        lineHeight: 20,
    },
    buttonContainer: {
        padding: 16,
        gap: 12,
    },
    saveButton: {
        paddingVertical: 6,
    },
    cancelButton: {
        paddingVertical: 6,
    },
});
