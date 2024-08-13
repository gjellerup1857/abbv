export function Button({ children, onClick }: ButtonProps): JSX.Element;
export type ButtonProps = {
    /**
     * - The content of the button.
     */
    children: React.ReactNode;
    /**
     * - The function to call when the button is clicked.
     */
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};
