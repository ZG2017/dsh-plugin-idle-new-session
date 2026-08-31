// Client half of @zg2017/dsh-plugin-idle-new-session.
//
// Behavior: track the last time the app was "opened" (a page load, or the
// tab/PWA becoming visible again after being backgrounded) in localStorage.
// Whenever that gap is >= 30 minutes, start a brand-new session instead of
// leaving whichever session/hero state DSH's own client happened to land
// on - the idea being that after a real gap, resuming an old, possibly
// unrelated conversation is more confusing than starting fresh.
//
// ctx.workspaces.startSession(workspaceId?) (packages/client/runtime/src/
// client/workspaces/service.ts) is the exact same call the sidebar's own
// "New Session" button makes (packages/client/ui-sidebar/src/client/
// SidebarRoot.tsx's onClick={() => { startSession() }}) - called with no
// argument, it falls back to the current/most-recently-used workspace on
// its own, so this correctly stays within whichever of the two users'
// workspaces was last active rather than needing to know which one that is
// itself.
window.__ModuleLoader__.load({
  id: '@zg2017/dsh-plugin-idle-new-session',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports

    var IDLE_THRESHOLD_MS = 30 * 60 * 1000
    var STORAGE_KEY = 'alice-last-opened-at'

    function getWorkspaces(ctx) {
      try {
        return ctx.get ? ctx.get('workspaces') : undefined
      } catch (e) {
        return undefined
      }
    }

    // Runs on every qualifying "open" (initial load, or visibility
    // returning to 'visible'): if the previous recorded open was 30+
    // minutes ago, start a new session; either way, record this open as
    // the new baseline so consecutive short gaps don't accumulate.
    function checkIdleAndMaybeStartNewSession(ctx) {
      var now = Date.now()
      var raw
      try {
        raw = localStorage.getItem(STORAGE_KEY)
      } catch (e) {
        raw = null
      }
      var last = raw ? parseInt(raw, 10) : NaN
      if (!isNaN(last) && (now - last) >= IDLE_THRESHOLD_MS) {
        var workspaces = getWorkspaces(ctx)
        if (workspaces && workspaces.startSession) workspaces.startSession()
      }
      try {
        localStorage.setItem(STORAGE_KEY, String(now))
      } catch (e) {
        // Private-browsing/storage-disabled: nothing to persist, every open
        // this session just never triggers the idle path - acceptable
        // degradation, not worth surfacing.
      }
    }

    function apply(ctx) {
      // ctx.get('workspaces') reliably returns undefined on the first tick
      // even though the service is constructed moments later - same
      // "wait for something to show up late" gotcha already established for
      // ctx.get('slots') in dsh-plugin-mobile-ui. Poll briefly.
      var attempts = 0
      var timer = setInterval(function () {
        attempts += 1
        var workspaces = getWorkspaces(ctx)
        if (!workspaces) {
          if (attempts >= 100) clearInterval(timer) // ~10s cap
          return
        }
        clearInterval(timer)
        checkIdleAndMaybeStartNewSession(ctx)
      }, 100)

      function onVisibilityChange() {
        if (document.visibilityState === 'visible') checkIdleAndMaybeStartNewSession(ctx)
      }
      document.addEventListener('visibilitychange', onVisibilityChange)

      ctx.effect(function () {
        return function () {
          clearInterval(timer)
          document.removeEventListener('visibilitychange', onVisibilityChange)
        }
      })
    }

    exports.apply = apply
    return module.exports
  },
})
