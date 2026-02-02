// 超级简单的首页 - 用于测试
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreenSimple() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>测试页面</Text>
            <Text>如果你能看到这个，说明基本加载没问题</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
