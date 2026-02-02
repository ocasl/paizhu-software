/**
 * 创建签名目录
 */
const fs = require('fs');
const path = require('path');

const signatureDir = path.join(__dirname, '../uploads/signatures');

if (!fs.existsSync(signatureDir)) {
    fs.mkdirSync(signatureDir, { recursive: true });
    console.log('✅ 签名目录已创建:', signatureDir);
} else {
    console.log('✅ 签名目录已存在:', signatureDir);
}
