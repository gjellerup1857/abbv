export const Circle = ({ label = "", size }) => {
  return (
    <svg data-testid="svg-icon-circle" className="fill-inherit" width={ size } viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" stroke="none"/>
      { label && <title>{ label }</title> }
    </svg>
  )
};

export default Circle;
