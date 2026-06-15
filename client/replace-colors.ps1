$f = 'c:\Users\Aman\Smart-Queue-Management\client\src\pages\Home.jsx'
$c = Get-Content $f -Raw

# Remaining blue references
$c = $c -replace 'text-blue-600', 'text-amber-600'
$c = $c -replace 'dark:text-blue-400', 'dark:text-amber-400'
$c = $c -replace 'bg-blue-50', 'bg-amber-50'
$c = $c -replace 'dark:bg-blue-950/40', 'dark:bg-amber-950/40'
$c = $c -replace 'border-blue-100', 'border-amber-200'
$c = $c -replace 'dark:border-blue-900/40', 'dark:border-amber-900/40'
$c = $c -replace 'bg-blue-600', 'bg-amber-500'
$c = $c -replace 'text-blue-700', 'text-amber-700'
$c = $c -replace 'text-blue-800', 'text-amber-800'

# Section backgrounds - warm cream
$c = $c -replace "bg-white/50 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800/80", "bg-surface-100/50 dark:bg-surface-950/50 border-y border-surface-200 dark:border-surface-700/80"

# Slate-50 backgrounds → surface
$c = $c -replace 'bg-slate-50 dark:bg-slate-900/60', 'bg-surface-100 dark:bg-surface-900/60'

# White/slate cards in sections
$c = $c -replace 'bg-white dark:bg-slate-800', 'bg-white dark:bg-surface-800'
$c = $c -replace 'border-slate-100 dark:border-slate-700/60', 'border-surface-200 dark:border-surface-700/60'

# Slate-100 background bars
$c = $c -replace 'bg-slate-100 dark:bg-slate-700', 'bg-surface-200 dark:bg-surface-700'

# Analytics section cards
$c = $c -replace 'bg-white dark:bg-slate-855', 'bg-white dark:bg-surface-800'
$c = $c -replace 'border-slate-200/60 dark:border-slate-700/60', 'border-surface-200/60 dark:border-surface-700/60'
$c = $c -replace 'border-slate-200/60 dark:border-slate-800/60', 'border-surface-200/60 dark:border-surface-700/60'

# FAQ section
$c = $c -replace 'bg-slate-50 dark:bg-slate-950', 'bg-surface-100 dark:bg-surface-950'
$c = $c -replace 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800', 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700'

# Modal
$c = $c -replace 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl', 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl'
$c = $c -replace 'dark:bg-slate-850', 'dark:bg-surface-800'
$c = $c -replace 'border-slate-200/60 dark:border-slate-800/80', 'border-surface-200/60 dark:border-surface-700/80'

# Emerald keeping for positive status
$c = $c -replace 'dark:bg-emerald-950/40', 'dark:bg-emerald-950/40'

Set-Content $f -Value $c -NoNewline
Write-Output "Home.jsx updated"
