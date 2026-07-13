param(
    [ValidateSet("All", "Music", "Coin")]
    [string]$Asset = "All"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

if ([string]::IsNullOrWhiteSpace($env:ELEVENLABS_API_KEY)) {
    throw "ELEVENLABS_API_KEY is required. Run this script through the local agent-secret broker."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$audioRoot = Join-Path $repoRoot "assets/audio"
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromMinutes(12)
$client.DefaultRequestHeaders.Add("xi-api-key", $env:ELEVENLABS_API_KEY)

function Invoke-ElevenLabsAudioGeneration {
    param(
        [Parameter(Mandatory)] [string]$Endpoint,
        [Parameter(Mandatory)] [hashtable]$Payload,
        [Parameter(Mandatory)] [string]$OutputPath
    )

    $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, $Endpoint)
    $json = $Payload | ConvertTo-Json -Depth 8 -Compress
    $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, "application/json")
    try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
        if (-not $response.IsSuccessStatusCode) {
            $detail = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
            throw "ElevenLabs returned HTTP $([int]$response.StatusCode): $detail"
        }
        $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
        [System.IO.File]::WriteAllBytes($OutputPath, $bytes)
        Write-Host "Generated $(Split-Path -Leaf $OutputPath) ($($bytes.Length) bytes)."
    }
    finally {
        $request.Dispose()
        if ($null -ne $response) { $response.Dispose() }
    }
}

try {
    if ($Asset -in @("All", "Music")) {
        Invoke-ElevenLabsAudioGeneration `
            -Endpoint "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128" `
            -OutputPath (Join-Path $audioRoot "space-starlight-stroll.mp3") `
            -Payload @{
                prompt = "Instrumental background music for a cheerful cozy block-building life-sim set on a friendly moon base. Warm electric piano, soft marimba and rounded plucked synth lead, tiny bell-like cosmic sparkles, gentle muted bass, and light brushed electronic percussion around 98 BPM. Playful, optimistic, airy, and comfortable for long exploration. Clear memorable motif with smooth transitions and a calm final cadence that can cycle naturally back to the opening. No vocals, no spoken words, no cinematic trailer drama, no heavy drums, no aggressive bass, no dark tension, no recognizable existing melody."
                music_length_ms = 65000
                model_id = "music_v1"
                force_instrumental = $true
                sign_with_c2pa = $true
            }
    }

    if ($Asset -in @("All", "Coin")) {
        Invoke-ElevenLabsAudioGeneration `
            -Endpoint "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_22050_32" `
            -OutputPath (Join-Path $audioRoot "space-coin-chime.mp3") `
            -Payload @{
                text = "A single cheerful sci-fi game coin pickup: a soft rounded marimba ping followed by a tiny bright synth sparkle, cute and rewarding, clean transient, very short tail, no voice, no ambience, no harshness"
                duration_seconds = 0.7
                prompt_influence = 0.55
                model_id = "eleven_text_to_sound_v2"
                loop = $false
            }
    }
}
finally {
    $client.Dispose()
}
