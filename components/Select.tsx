import { FormControl, InputLabel, MenuItem, Select as MuiSelect } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type Props = {
  options: {
    label: string;
    value: any;
  }[];
  label: string;
  selectedValue: any;
  onChange: (value: any) => void;
};

const Select = (props: Props) => {
  const theme = useTheme()

  return (
    <FormControl fullWidth sx={{backgroundColor: theme.palette.background.paper}}>
      <InputLabel id={'custom-select-label'}>
        {props.label}
      </InputLabel>
      <MuiSelect
        labelId={'custom-select-label'}
        id={'custom-select'}
        defaultValue={props.selectedValue === -1 ? '' : props.selectedValue}
        value={props.selectedValue === -1 ? '' : props.selectedValue}
        label={props.label}
        onChange={(evt) => props.onChange(evt.target.value)}>
        {props.options.map(({value, label}) => (
          <MenuItem key={label} value={value}>
            {label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default Select;
