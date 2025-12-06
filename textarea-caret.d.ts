declare module 'textarea-caret' {
  export interface CaretCoordinates {
    top: number;
    left: number;
    height: number;
    width?: number;
  }

  function getCaretCoordinates(
    element: HTMLTextAreaElement | HTMLInputElement,
    position: number
  ): CaretCoordinates;

  export default getCaretCoordinates;
}
