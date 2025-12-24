export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Organization Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your organization's settings and preferences
        </p>
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              General
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Basic organization information
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="VeilSuite"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Organization ID
                </label>
                <input
                  type="text"
                  value="org_2a3b4c5d6e7f8g9h"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Security
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Security and access control settings
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Two-Factor Authentication
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Require 2FA for all administrators
                  </p>
                </div>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700"
                  disabled
                >
                  <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white transition" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Session Timeout
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Automatically log out inactive users
                  </p>
                </div>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700"
                  disabled
                >
                  <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Notifications
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Configure email and system notifications
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Election Start Notifications
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Notify when an election begins
                  </p>
                </div>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700"
                  disabled
                >
                  <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white transition" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Daily Summary Reports
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Receive daily election activity summaries
                  </p>
                </div>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700"
                  disabled
                >
                  <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white transition" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder message */}
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Additional settings panels will be added as features are implemented
          </p>
        </div>
      </div>
    </div>
  );
}
