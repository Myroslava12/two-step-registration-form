import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Country } from 'src/app/interfaces';
import { CountryCodesFacade } from 'src/app/store/country-codes/country-codes.facade';
import { PhoneNumberUtil } from 'google-libphonenumber';
import { RegistrationFacade } from 'src/app/store/registration/registration.facade';

@Component({
  selector: 'app-contact-information-component',
  templateUrl: './contact-information.component.html',
  styleUrls: ['./contact-information.component.scss']
})
export class ContactInformationComponent implements OnInit {
  modalIsVisable: boolean = false;
  form: FormGroup;
  countryCodes$: Observable<Country[]>;
  country: Country;
  isLoading$: Observable<boolean>;
  errorMessage$: Observable<string | null>;

  constructor(
    private formBuilder: FormBuilder,
    private countryCodesFacade: CountryCodesFacade,
    private registrationFacade: RegistrationFacade) 
  {
    this.countryCodes$ = this.countryCodesFacade.countryCodes$;
    this.isLoading$ = this.countryCodesFacade.isLoading$;
    this.errorMessage$ = this.countryCodesFacade.errorMessage$;

    this.form = this.formBuilder.group({
      country: new FormControl('', [Validators.required]),
      phoneNumber: new FormControl('', [Validators.required])
    }, {
      validator: this.phoneNumberValidation('phoneNumber')
    });
  }

  ngOnInit(): void {
    this.form.get('country')?.valueChanges.subscribe(val => {
      if (val.length !== 0) {
        this.form.get('phoneNumber')?.enable();
      }
    });

    if (this.form.get('country')?.value.length === 0) {
      this.form.get('phoneNumber')?.disable();
    }

    this.countryCodesFacade.getCountryCodes();
  }

  phoneNumberValidation(phoneNumberValue: string): ValidatorFn {
    const phoneNumberUtil = PhoneNumberUtil.getInstance();
    let validNumber = false;

    return (control: AbstractControl): ValidationErrors | null => {
      if (this.country && `${control.get(phoneNumberValue)?.value}`.length > 1) {
        const phoneNumber = phoneNumberUtil.parse(
          `${control.get(phoneNumberValue)?.value}`, this.country.code
        );
        validNumber = phoneNumberUtil.isValidNumber(phoneNumber);

        return validNumber ? null : { 'phoneNumberInvalid': true };
      }

      return null;
    }
  }

  changeCountry(country: Country) {
    this.country = country;
  }

  onOpenReviewDialog() {
    this.form.markAllAsTouched();
    console.log(this.form)

    if (this.form.invalid) return;

    const value = this.form.value;
    const updates = {
      country: value.country.code,
      phoneNumber: `${this.country.dial_code} ${value.phoneNumber}`
    }
    this.registrationFacade.postContactInformation(updates);

    setTimeout(() => this.modalIsVisable = true);
    
  }

  get controls() {
    return this.form.controls;
  }

  onCloseReviewDialog(value: boolean) {
    console.log(value)
    this.modalIsVisable = value;
  }

  onSubmit() {
    console.log(this.form.value);
  }
}