$word = New-Object -ComObject Word.Application
$word.Visible = $false
$folder = "e:\CODE\paizhu-software\backend\muban"
$files = Get-ChildItem $folder -Filter "*.doc"

foreach ($file in $files) {
    # 只处理 .doc 文件，忽略 .docx
    if ($file.Extension -eq ".doc") {
        try {
            $doc = $word.Documents.Open($file.FullName)
            $newFilename = $file.FullName -replace "\.doc$", ".docx"
            $doc.SaveAs([ref]$newFilename, [ref]12) # 12 = wdFormatXMLDocument
            $doc.Close()
            Write-Host "成功转换: $($file.Name) -> $(Split-Path $newFilename -Leaf)"
        } catch {
            Write-Error "转换失败: $($file.Name) - $_"
        }
    }
}
$word.Quit()
