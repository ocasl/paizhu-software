const fs = require('fs');
const path = require('path');

const psScript = `
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "e:\\CODE\\paizhu-software\\backend\\muban\\temp_log.docx"
$wdStory = 6

try {
    $doc = $word.Documents.Open($docPath)
    $sel = $word.Selection
    
    # Try finding "监所" loosely
    $sel.HomeKey($wdStory)
    $sel.Find.ClearFormatting()
    $sel.Find.Text = "监所"
    $sel.Find.Forward = $true
    $sel.Find.Wrap = 0 
    
    if ($sel.Find.Execute()) {
        $sel.MoveRight(1, 1)
        $sel.TypeText("{派驻监所}")
        Write-Host "Fixed: Prison Name Tag"
    } else {
        Write-Warning "Still not found: Prison Name"
    }

    $doc.Save()
    $doc.Close()
} catch {
    Write-Error $_
} finally {
    $word.Quit()
}
`;

fs.writeFileSync(path.join(__dirname, 'fix_prison_tag_bom.ps1'), '\uFEFF' + psScript, 'utf8');
console.log('Fix script created');
