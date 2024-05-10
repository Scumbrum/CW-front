import {AbstractControl, FormArray, ValidatorFn} from "@angular/forms";

export const minLengthArray = (min: number): ValidatorFn => {
  return (c: AbstractControl) => {
    const array = c as FormArray;
    if (array.length >= min)
      return null;

    return { MinLengthArray: true};
  }
}
