import { useLocation, Link, useNavigate } from 'react-router-dom'
import PdfExport from '../components/PdfExport'
import { useLang } from '../lib/lang'

export default function Result() {
  const { t } = useLang()
  const location = useLocation()
  const navigate = useNavigate()
  const { form, result } = location.state || {}
  console.log("RESULT OBJECT:", result)
  console.log("DEBUG OBJECT:", result?._debug)
  console.log(
    'PLAN_RENDERED',
    JSON.stringify({
      days: result.days?.map(d => ({
        day: d.day,
        focus: d.focus,
        exercises: d.exercises.map(e => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest,
          source: e.repSource || 'unknown',
        }))
      })),
      dailyCalories: result.dailyCalories,
      protein: result.protein,
      bmr: result.bmr,
      split: result.split,
      trainingType: result.trainingType
    }, null, 2)
  );

  const debugVersion = result?.debugVersion

  if (!result) {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-4 pt-16 text-center">
        <div className="text-6xl">🤷</div>
        <p className="text-zinc-400">{t('res_no_plan')}</p>
        <Link to="/generator" className="text-rmared-500 underline">{t('res_back_gen')}</Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6" id="workout-result">
      {result?._debug && (
        <pre className="overflow-x-auto rounded-lg border border-rmared-500/30 bg-black/50 p-3 text-xs text-green-400">
{JSON.stringify(result._debug, null, 2)}
        </pre>
      )}
      {result?.planSource && (
        <div className={`rounded-lg border p-3 text-center text-sm font-bold ${
          result.planSource === 'NORMAL'
            ? 'border-green-600 bg-green-900/40 text-green-300'
            : result.planSource === 'EMERGENCY'
            ? 'border-yellow-600 bg-yellow-900/40 text-yellow-300'
            : 'border-red-600 bg-red-900/40 text-red-300'
        }`}>
          PLAN SOURCE: {result.planSource}
          {result.planSource !== 'NORMAL' && (
            <span className="ml-2 text-xs font-normal opacity-70">(normal generation failed — fallback plan)</span>
          )}
        </div>
      )}
      {debugVersion && (
        <div className="rounded-lg border border-yellow-600 bg-yellow-900/40 p-3 text-center text-sm font-bold text-yellow-300">
          DEBUG VERSION: {debugVersion}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="cursor-pointer rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200">{t('res_back')}</button>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold md:text-3xl">{t('res_title')} 🥋</h1>
        <p className="mt-1 text-zinc-400">{form?.name ? `${t('res_for')} ${form.name}` : ''}</p>
      </div>

      <div className="card-glow space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <InfoRow label={t('res_goal')} value={result.trainingType || '—'} />
          <InfoRow label={t('wf_level')} value={form?.level === 'beginner' ? t('level_beginner') : form?.level === 'intermediate' ? t('level_intermediate') : t('level_advanced')} />
          <InfoRow label={t('days')} value={`${form?.days} ${t('days')}`} />
          <InfoRow label={t('res_split')} value={result.split} />
        </div>
      </div>

      {result.bmr && (
        <div className="card-glow rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <h2 className="mb-3 text-lg font-bold text-rmared-500">{t('res_personal')}</h2>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <InfoRow label={`${t('res_bmr')} (BMR)`} value={result.bmr} />
            <InfoRow label={t('res_calories')} value={result.dailyCalories} />
            <InfoRow label={t('res_protein')} value={result.protein} />
          </div>
        </div>
      )}

      {console.log('FULL_PLAN_FROM_UI', result.days)}
      {result.days && result.days.map((day, di) => (
        <div key={di} className="card-glow rounded-xl border border-rmared-900/40 bg-zinc-900/50 p-4 md:p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rmared-600 text-sm font-bold text-white">{di + 1}</span>
            <h2 className="text-lg font-bold text-zinc-100">{day.day}</h2>
          </div>
          <p className="mb-3 text-xs text-zinc-500">{t('res_focus')}: {day.focus}</p>
          <div className="divide-y divide-zinc-800">
            {day.exercises.map((ex, ei) => (
              <div key={ei} className={`flex items-center justify-between py-3 text-sm ${ex.durationMinutes ? 'rounded-lg bg-red-950/20 px-3' : ''}`}>
                {console.log('UI_EXERCISE', ex.name, ex.sets, ex.reps, ex.rest)}
                <span className={`font-medium ${ex.durationMinutes ? 'text-red-400' : 'text-zinc-200'}`}>
                  {ex.durationMinutes ? '🔥 ' : ''}{ex.name}
                </span>
                {ex.durationMinutes ? (
                  <span className="whitespace-nowrap font-bold text-red-400">⏱ {ex.durationMinutes} {t('res_min')}</span>
                ) : (
                  <span className="whitespace-nowrap text-zinc-400">{ex.sets} × {ex.reps} | {t('res_rest')} {ex.rest}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Fallback for old format (no days array) */}
      {!result.days && result.exercises && (
        <div className="card-glow rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
          <h2 className="mb-3 text-lg font-bold text-rmared-500">{t('res_exercises')}</h2>
          <div className="divide-y divide-zinc-800">
            {result.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-zinc-200">{ex.name}</span>
                <span className="text-zinc-400">{ex.sets} × {ex.reps} | {t('res_rest')} {ex.rest}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result._debug && (
        <div className="card-glow rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-3">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">DEBUG</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-zinc-500">Source:</span>
            <span className="font-medium text-zinc-200">{result._debug.source}</span>
            <span className="text-zinc-500">Score:</span>
            <span className={`font-medium ${result._debug.score >= 85 ? 'text-green-400' : 'text-red-400'}`}>{result._debug.score}/100</span>
            {result._debug.db != null && (
              <><span className="text-zinc-500">DB / Inferred:</span><span className="font-medium text-zinc-200">{result._debug.db} / {result._debug.inferred}</span></>
            )}
            <span className="text-zinc-500">Recognized:</span>
            <span className="font-medium text-zinc-200">{result._debug.recognized}</span>
            <span className="text-zinc-500">Unknown:</span>
            <span className={`font-medium ${result._debug.unknown > 0 ? 'text-red-400' : 'text-zinc-200'}`}>{result._debug.unknown}</span>
          </div>
        </div>
      )}

      <div className="card-glow rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <h2 className="mb-3 text-lg font-bold text-rmared-500">{t('res_nutrition')}</h2>
        <p className="text-sm text-zinc-300">{result.nutrition}</p>
      </div>

      <div className="card-glow rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
        <h2 className="mb-3 text-lg font-bold text-rmared-500">{t('res_tips')}</h2>
        <ul className="space-y-2 text-sm text-zinc-300">
          {result.tips.map((tip, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-rmared-500">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <PdfExport form={form} result={result} />
        <button
          onClick={() => navigate('/generator')}
          className="w-full cursor-pointer rounded-lg border border-zinc-700 px-6 py-3 text-center font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
        >
          {t('res_new')}
        </button>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col border-b border-zinc-800 pb-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  )
}
