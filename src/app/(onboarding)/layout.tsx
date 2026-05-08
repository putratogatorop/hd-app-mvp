/**
 * Onboarding route group layout
 * Minimal — no BottomNav, no persistent header.
 * Full-screen immersive experience for new users.
 * Each child page manages its own background and layout.
 */

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      {children}
    </div>
  )
}
