import React, { useState } from 'react';
import { FormContainer } from '../../../common/forms/FormContainer/FormContainer';
import { Input } from '../../../common/Input/Input';
import { Button } from '../../../common/Button/Button';
import { FormActions } from '../../../common/forms/FormActions/FormActions';

export type SettingValue = string | number | boolean;
export type PlatformSettings = Record<string, SettingValue>;
export interface PlatformSettingsFormProps { initialValues: PlatformSettings; onSubmit: (values: PlatformSettings) => void | Promise<void>; submitting?: boolean; }
export const PlatformSettingsForm: React.FC<PlatformSettingsFormProps> = ({ initialValues, onSubmit, submitting = false }) => {
  const [values, setValues] = useState(initialValues);
  return <FormContainer title="Platform settings" onSubmit={event => { event.preventDefault(); void onSubmit(values); }}>
    {Object.entries(values).map(([key, value]) => typeof value === 'boolean'
      ? <label key={key} className="ui-checkbox-field"><input type="checkbox" checked={value} onChange={event => setValues({ ...values, [key]: event.target.checked })} />{key}</label>
      : <Input key={key} label={key} type={typeof value === 'number' ? 'number' : 'text'} value={value} onChange={event => setValues({ ...values, [key]: typeof value === 'number' ? Number(event.target.value) : event.target.value })} />)}
    <FormActions><Button type="submit" loading={submitting}>Save settings</Button></FormActions>
  </FormContainer>;
};
export default PlatformSettingsForm;
