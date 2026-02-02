/**
 * 模板同步 API 测试脚本
 * 使用 muban 目录下的模板文件测试各个上传接口
 */
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')

const API_BASE = 'http://localhost:3000/api'
const MUBAN_DIR = path.join(__dirname, '../muban')

// 测试用的管理员凭据（需要先登录获取token）
async function getAuthToken() {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: 'admin123' // 假设的管理员密码
        })
        return response.data.token
    } catch (error) {
        console.error('登录失败:', error.response?.data || error.message)
        // 尝试其他密码
        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                username: 'admin',
                password: '123456'
            })
            return response.data.token
        } catch (e) {
            console.error('备用密码也失败了，请手动设置token')
            return null
        }
    }
}

// 上传文件测试
async function testUpload(endpoint, filePath, typeName, token) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`测试: ${typeName}`)
    console.log(`文件: ${path.basename(filePath)}`)
    console.log(`接口: POST ${endpoint}`)
    console.log('='.repeat(60))

    if (!fs.existsSync(filePath)) {
        console.log(`❌ 文件不存在: ${filePath}`)
        return null
    }

    const formData = new FormData()
    formData.append('file', fs.createReadStream(filePath))

    try {
        const response = await axios.post(
            `${API_BASE}${endpoint}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${token}`
                }
            }
        )

        const result = response.data
        console.log('✅ 上传成功!')
        console.log(`   类型: ${result.typeName || result.type}`)
        console.log(`   总记录: ${result.stats?.total || 0}`)
        console.log(`   新增: ${result.stats?.inserted || 0}`)
        console.log(`   更新: ${result.stats?.updated || 0}`)
        console.log(`   错误: ${result.stats?.errors || 0}`)
        console.log(`   批次ID: ${result.syncBatch}`)

        if (result.errorDetails?.length > 0) {
            console.log('   错误详情:', result.errorDetails)
        }

        return result
    } catch (error) {
        console.log('❌ 上传失败!')
        console.log('   错误:', error.response?.data?.error || error.message)
        return null
    }
}

// 获取统计数据
async function getStats(token) {
    console.log('\n' + '='.repeat(60))
    console.log('获取统计数据')
    console.log('='.repeat(60))

    try {
        const response = await axios.get(`${API_BASE}/template-sync/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        const stats = response.data
        console.log('✅ 统计数据:')
        console.log(`   罪犯信息: ${stats.prisoners}`)
        console.log(`   严管教育: ${stats.strictEducation}`)
        console.log(`   禁闭记录: ${stats.confinement}`)
        console.log(`   戒具使用: ${stats.restraint}`)
        console.log(`   信件记录: ${stats.mail}`)
        console.log(`   涉黑恶名单: ${stats.blacklist}`)
        console.log(`   总计: ${stats.total}`)

        return stats
    } catch (error) {
        console.log('❌ 获取统计失败:', error.response?.data?.error || error.message)
        return null
    }
}

// 主测试流程
async function runTests() {
    console.log('\n🚀 开始模板同步 API 测试\n')
    console.log('模板目录:', MUBAN_DIR)

    // 获取认证token
    console.log('\n📝 正在登录获取token...')
    const token = await getAuthToken()

    if (!token) {
        console.log('\n⚠️ 无法获取token，使用测试模式（可能会失败）')
    } else {
        console.log('✅ 登录成功，获取到token')
    }

    // 测试各个接口
    const tests = [
        {
            endpoint: '/template-sync/strict-education',
            file: '严管教育审批.xlsx',
            name: '严管教育审批'
        },
        {
            endpoint: '/template-sync/confinement',
            file: '禁闭审批.xlsx',
            name: '禁闭审批'
        },
        {
            endpoint: '/template-sync/blacklist',
            file: '涉黑恶名单.xls',
            name: '涉黑恶名单'
        },
        {
            endpoint: '/template-sync/restraint',
            file: '戒具使用审批.xlsx',
            name: '戒具使用审批'
        },
        {
            endpoint: '/template-sync/mail',
            file: '信件汇总.xlsx',
            name: '信件汇总'
        }
    ]

    const results = []

    for (const test of tests) {
        const filePath = path.join(MUBAN_DIR, test.file)
        const result = await testUpload(test.endpoint, filePath, test.name, token)
        results.push({ ...test, success: !!result, result })
    }

    // 获取更新后的统计
    await getStats(token)

    // 输出汇总
    console.log('\n' + '='.repeat(60))
    console.log('📊 测试结果汇总')
    console.log('='.repeat(60))

    let passed = 0, failed = 0
    for (const r of results) {
        if (r.success) {
            console.log(`✅ ${r.name}: 成功 (新增${r.result.stats.inserted}/更新${r.result.stats.updated})`)
            passed++
        } else {
            console.log(`❌ ${r.name}: 失败`)
            failed++
        }
    }

    console.log('\n' + '-'.repeat(60))
    console.log(`总计: ${passed} 成功, ${failed} 失败`)
    console.log('='.repeat(60))
}

runTests().catch(console.error)
