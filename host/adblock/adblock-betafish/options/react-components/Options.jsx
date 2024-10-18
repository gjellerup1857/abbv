import { Checkbox, Icon, Link, ToggleSwitch } from "@eyeo/ext-ui-components";
import { translate } from './utils';

const changeHandler = () => console.log('change is possible');

const OptionItem = ({
  name,
  text,
  extraInfo,
  helpLink,
  additionalInfoLink,
  subOptions,
  selector: Selector = Checkbox
}) => {
  return (
    <li key={ name }>
      <div className="flex">
        <div className="flex">
          {/* The Toggle and Checkbox APIs need to be aligned */}
          <Selector id={ name } name={ name } onChange={ changeHandler } />
          <label for={ name }>{translate(text)}</label>
        </div>
        <div className="flex">
          { additionalInfoLink && <Link href={ additionalInfoLink.href }>{translate(additionalInfoLink.text)}</Link>}
          { helpLink && <Link href={ helpLink }><Icon name='live-help' ariaLabel='learn_more_without_period' /></Link> }
        </div>
      </div>
      <div>
        { extraInfo && <span>{translate(extraInfo)}</span> }
      </div>
      <div className="ml-2.5">
        { subOptions &&  subOptions.map((option) => <OptionItem selector={ ToggleSwitch } { ...option } />) }
      </div>

    </li>
  )
}

export const GeneralOptionsList = ({ items }) => {
  return (
    <>
      <h1>{ translate('generaloptions2') }</h1>
      <ul>
        {
          items.map((item) => <OptionItem {...item} />)
        }
      </ul>
    </>
  )
}
