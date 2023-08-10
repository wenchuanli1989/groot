import { InputNumber, Slider } from "antd";
import { useState } from "react";


type PropsType = {
  value?: number,
  onChange?: (v: number) => void;
  min: number,
  max: number
}

const NumberSlider: React.FC<PropsType> = ({ value, onChange, min, max }) => {
  const [inputValue, setInputValue] = useState(value);

  const change = (newValue: number) => {
    setInputValue(newValue);
    onChange(newValue);
  };


  return <div className="number-slider">
    <div style={{ display: 'inline-block', width: '80%', verticalAlign: 'bottom' }}>
      <Slider min={min} max={max} value={inputValue} onChange={change} />
    </div>
    <div style={{ display: 'inline-block', width: '20%' }}>
      <InputNumber min={min} max={max} value={inputValue} onChange={change} />
    </div>
  </div>
}

export default NumberSlider;