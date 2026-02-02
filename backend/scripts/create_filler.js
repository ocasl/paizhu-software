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
    
    function Fill-Next-Cell($searchText, $tag, $isDown) {
        $sel.Find.ClearFormatting()
        $sel.Find.Text = $searchText
        $sel.Find.Forward = $true
        $sel.Find.Wrap = 0 # wdFindStop
        
        if ($sel.Find.Execute()) {
            if ($isDown) {
                $sel.MoveDown(5, 1) # wdLine=5
            } else {
                $sel.MoveRight(1, 1) # wdCharacter/Cell
            }
            $sel.TypeText($tag)
            Write-Host "Filled: $searchText -> $tag"
            return $true
        } else {
            Write-Warning "Not Found: $searchText"
            return $false
        }
    }

    # 1. Basic Info
    $sel.HomeKey($wdStory)
    Fill-Next-Cell "派驻监所" "{派驻监所}" $false
    
    $sel.HomeKey($wdStory)
    Fill-Next-Cell "派驻人员" "{派驻人员}" $false
    
    $sel.HomeKey($wdStory)
    # Try finding with spaces if needed, but start simple
    if (-not (Fill-Next-Cell "日期" "{日期}" $false)) {
         $sel.HomeKey($wdStory)
         Fill-Next-Cell "日  期" "{日期}" $false
    }
    
    $sel.HomeKey($wdStory)
    Fill-Next-Cell "填写人" "{填写人}" $false

    # 2. Stats
    $sel.HomeKey($wdStory)
    Fill-Next-Cell "地点位置" "{现场检察位置}" $true
    
    # 3. Handling Duplicate Labels (Strict vs Equip)
    # First "新增人员" -> Strict Control
    $sel.HomeKey($wdStory)
    if ($sel.Find.Execute("新增人员")) {
        $sel.MoveDown(5, 1)
        $sel.TypeText("{严管新增}")
        Write-Host "Filled: Strict Control (新增人员)"
    }
    
    # Continue search for next "新增人员" -> Equip
    if ($sel.Find.Execute("新增人员")) {
         $sel.MoveDown(5, 1)
         $sel.TypeText("{警戒具人数}")
         Write-Host "Filled: Equip (新增人员)"
    }

    # Admission
    $sel.HomeKey($wdStory)
    if ($sel.Find.Execute("收押")) {
         $sel.MoveDown(5, 1)
         $sel.TypeText("{收押调出}")
         Write-Host "Filled: Admission (收押)"
    }

    # 4. Large Text Blocks
    # Supervision
    $sel.HomeKey($wdStory)
    Fill-Next-Cell "检察监督情况" "{检察监督情况}" $false
    Fill-Next-Cell "检察监督情况" "{其他监督情况}" $false
    
    # Feedback
    $sel.HomeKey($wdStory)
    Fill-Next-Cell "采纳反馈情况" "{采纳反馈情况}" $false
    Fill-Next-Cell "采纳反馈情况" "{其他反馈情况}" $false

    $doc.Save()
    $doc.Close()
} catch {
    Write-Error $_
} finally {
    $word.Quit()
}
`;

// Write with BOM for PowerShell 5.1 compatibility
fs.writeFileSync(path.join(__dirname, 'fill_tags_bom.ps1'), '\uFEFF' + psScript, 'utf8');
console.log('Script created with BOM');
