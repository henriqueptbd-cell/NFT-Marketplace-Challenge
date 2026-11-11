import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { accountCopy } from '@/lib/account-copy'

export interface AccountTextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  description?: string
  type?: 'text' | 'email' | 'password' | 'url'
  autoComplete?: string
  required?: boolean
  disabled?: boolean
}

export function AccountTextField({
  id,
  label,
  value,
  onChange,
  error,
  description,
  type = 'text',
  autoComplete,
  required = false,
  disabled = false,
}: AccountTextFieldProps) {
  const describedBy = [
    description ? `${id}-description` : undefined,
    error ? `${id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <FormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      requiredIndicator={accountCopy.common.required}
    >
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
      />
    </FormField>
  )
}
