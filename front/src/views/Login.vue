<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// API 基础地址
const API_BASE = 'http://localhost:3000/api'

// 表单数据
const loginForm = reactive({
    username: '',
    password: ''
})

const isLoading = ref(false)
const isRegister = ref(false)

// 注册表单额外字段
const registerForm = reactive({
    name: '',
    prisonName: '女子监狱'
})

// 登录
async function handleLogin() {
    if (!loginForm.username || !loginForm.password) {
        ElMessage.warning('请输入用户名和密码')
        return
    }

    isLoading.value = true
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginForm)
        })

        const data = await response.json()

        if (response.ok) {
            // 清除旧的报告数据缓存（避免显示上一个用户的监狱名称）
            localStorage.removeItem('paizhu-report-data')
            localStorage.removeItem('paizhu-settings')
            
            // 保存 token 和用户信息到 localStorage
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            
            // 更新 Pinia store
            userStore.login(data.user, data.token)
            
            ElMessage.success('登录成功')
            router.push('/')
        } else {
            ElMessage.error(data.error || '登录失败')
        }
    } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error('无法连接服务器，请确保后端已启动')
    } finally {
        isLoading.value = false
    }
}

// 注册
async function handleRegister() {
    if (!loginForm.username || !loginForm.password || !registerForm.name) {
        ElMessage.warning('请填写所有必填项')
        return
    }

    isLoading.value = true
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: loginForm.username,
                password: loginForm.password,
                name: registerForm.name,
                prisonName: registerForm.prisonName
            })
        })

        const data = await response.json()

        if (response.ok) {
            ElMessage.success('注册成功，请登录')
            isRegister.value = false
        } else {
            ElMessage.error(data.error || '注册失败')
        }
    } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error('无法连接服务器')
    } finally {
        isLoading.value = false
    }
}

// 切换登录/注册
function toggleMode() {
    isRegister.value = !isRegister.value
}
</script>

<template>
    <div class="login-page">
        <div class="login-container">
            <div class="login-header">
                <h1>智慧派驻检察系统</h1>
                <p>{{ isRegister ? '注册新账号' : '登录系统' }}</p>
            </div>

            <el-form class="login-form" @submit.prevent="isRegister ? handleRegister() : handleLogin()">
                <el-form-item>
                    <el-input
                        v-model="loginForm.username"
                        placeholder="用户名"
                        :prefix-icon="User"
                        size="large"
                    />
                </el-form-item>

                <el-form-item>
                    <el-input
                        v-model="loginForm.password"
                        type="password"
                        placeholder="密码"
                        :prefix-icon="Lock"
                        size="large"
                        show-password
                    />
                </el-form-item>

                <template v-if="isRegister">
                    <el-form-item>
                        <el-input
                            v-model="registerForm.name"
                            placeholder="姓名"
                            size="large"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-input
                            v-model="registerForm.prisonName"
                            placeholder="派驻监所"
                            size="large"
                        />
                    </el-form-item>
                </template>

                <el-form-item>
                    <el-button
                        type="primary"
                        size="large"
                        :loading="isLoading"
                        native-type="submit"
                        class="submit-btn"
                    >
                        {{ isRegister ? '注 册' : '登 录' }}
                    </el-button>
                </el-form-item>

                <div class="form-footer">
                    <span>{{ isRegister ? '已有账号？' : '没有账号？' }}</span>
                    <el-button type="primary" link @click="toggleMode">
                        {{ isRegister ? '去登录' : '注册账号' }}
                    </el-button>
                </div>
            </el-form>

            <div class="default-account">
                <el-divider>默认管理员账号</el-divider>
                <p>用户名: <code>admin</code></p>
                <p>密码: <code>admin123</code></p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
    background: white;
    border-radius: 16px;
    padding: 40px;
    width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
    text-align: center;
    margin-bottom: 32px;
}

.login-header h1 {
    font-size: 24px;
    color: #303133;
    margin-bottom: 8px;
}

.login-header p {
    color: #909399;
}

.login-form {
    margin-bottom: 24px;
}

.submit-btn {
    width: 100%;
}

.form-footer {
    text-align: center;
    color: #909399;
}

.default-account {
    text-align: center;
    font-size: 13px;
    color: #909399;
}

.default-account code {
    background: #f5f7fa;
    padding: 2px 8px;
    border-radius: 4px;
    color: #409EFF;
}
</style>
