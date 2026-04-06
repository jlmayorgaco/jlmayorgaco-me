Get-ChildItem -Path scripts/bot -Recurse -Filter *.ts | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "from '../../logger'", "from '../../infrastructure/logging/Logger'"
    $content = $content -replace "from '../../config'", "from '../../config/index'"
    $content = $content -replace "from '../../gemini'", "from '../../infrastructure/external/GeminiService'"
    $content = $content -replace "from '../../publisher'", "from '../../infrastructure/external/GitPublisher'"
    $content = $content -replace "from '../../news-scanner'", "from '../../infrastructure/connectors/RssConnector'"
    $content = $content -replace "from '../../blog-generator'", "from '../../infrastructure/formatting/BlogGenerator'"
    $content = $content -replace "from '../../session-manager'", "from '../../infrastructure/persistence/SessionManager'"
    $content = $content -replace "from '../../telegram'", "from '../../infrastructure/inbound/TelegramBot'"
    $content = $content -replace "from '../../validation'", "from '../../shared/validation'"
    $content = $content -replace "from '../logger'", "from '../infrastructure/logging/Logger'"
    $content = $content -replace "from '../config'", "from '../config/index'"
    $content = $content -replace "from '../telegram'", "from '../infrastructure/inbound/TelegramBot'"
    $content = $content -replace "from '../session-manager'", "from '../infrastructure/persistence/SessionManager'"
    $content = $content -replace "from '../utils'", "from '../shared/utils'"
    $content = $content -replace "from '../validation'", "from '../shared/validation'"
    Set-Content $_.FullName $content -Encoding UTF8
}
