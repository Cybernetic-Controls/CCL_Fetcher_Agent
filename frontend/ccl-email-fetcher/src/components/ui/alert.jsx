import * as React from 'react'

const Alert = React.forwardRef(({ children, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={`rounded-lg border p-4 ${
      variant === "destructive" 
        ? "border-red-500 bg-red-50 text-red-700"
        : "border-gray-200 bg-white"
    }`}
    {...props}
  >
    {children}
  </div>
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className="text-sm [&_p]:leading-relaxed"
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }