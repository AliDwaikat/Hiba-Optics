/* Small inline icon set for the admin shell (lucide-react is not installed). */
type IconProps = { className?: string }

function base(children: React.ReactNode, className = '') {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const DashboardIcon = ({ className }: IconProps) =>
  base(
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>,
    className,
  )

export const ProductsIcon = ({ className }: IconProps) =>
  base(
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.8Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </>,
    className,
  )

export const OrdersIcon = ({ className }: IconProps) =>
  base(
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>,
    className,
  )

export const BookingsIcon = ({ className }: IconProps) =>
  base(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>,
    className,
  )

export const ReviewsIcon = ({ className }: IconProps) =>
  base(
    <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.05 1.1-6.47-4.7-4.58 6.5-.95z" />,
    className,
  )

export const BranchesIcon = ({ className }: IconProps) =>
  base(
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>,
    className,
  )

export const BrandsIcon = ({ className }: IconProps) =>
  base(
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="M8.2 13.3 7 22l5-3 5 3-1.2-8.7" />
    </>,
    className,
  )

export const MenuIcon = ({ className }: IconProps) =>
  base(<path d="M4 7h16M4 12h16M4 17h16" />, className)

export const CloseIcon = ({ className }: IconProps) =>
  base(<path d="M6 6l12 12M18 6 6 18" />, className)

export const LogoutIcon = ({ className }: IconProps) =>
  base(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
    className,
  )
