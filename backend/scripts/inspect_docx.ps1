$word = New-Object -ComObject Word.Application
$word.Visible = $false
$docPath = "e:\CODE\paizhu-software\backend\muban\temp_log.docx"

try {
    $doc = $word.Documents.Open($docPath)
    $table = $doc.Tables(1)
    
    Write-Host "Table Rows: $($table.Rows.Count)"
    Write-Host "--- Table Dump ---"
    
    for ($r = 1; $r -le $table.Rows.Count; $r++) {
        $rowStr = "Row $r : "
        try {
            for ($c = 1; $c -le $table.Rows($r).Cells.Count; $c++) {
                $text = $table.Cell($r, $c).Range.Text -replace "[\r\n\a]", ""
                $rowStr += "[$c] '$text'  |  "
            }
        } catch {
            $rowStr += "(Error reading cells in row $r)"
        }
        Write-Host $rowStr
    }
    
    $doc.Close($false)
} catch {
    Write-Error $_
} finally {
    $word.Quit()
}
