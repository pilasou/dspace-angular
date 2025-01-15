import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormGroup, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import {
  DynamicCheckboxModel,
  DynamicFormControlComponent,
  DynamicFormLayoutService,
  DynamicFormValidationService
} from '@ng-dynamic-forms/core';
import findKey from 'lodash/findKey';

import { hasValue, isNotEmpty } from '../../../../../empty.util';
import { DynamicListCheckboxGroupModel } from './dynamic-list-checkbox-group.model';
import { FormBuilderService } from '../../../form-builder.service';
import { DynamicListRadioGroupModel } from './dynamic-list-radio-group.model';
import { VocabularyService } from '../../../../../../core/submission/vocabularies/vocabulary.service';
import { getFirstSucceededRemoteDataPayload } from '../../../../../../core/shared/operators';
import { PaginatedList } from '../../../../../../core/data/paginated-list.model';
import { VocabularyEntry } from '../../../../../../core/submission/vocabularies/models/vocabulary-entry.model';
import { PageInfo } from '../../../../../../core/shared/page-info.model';
import { EMPTY, expand, reduce } from "rxjs";

export interface ListItem {
  id: string;
  label: string;
  value: boolean;
  index: number;
}

/**
 * Component representing a list input field
 */
@Component({
  selector: 'ds-dynamic-list',
  styleUrls: ['./dynamic-list.component.scss'],
  templateUrl: './dynamic-list.component.html'
})
export class DsDynamicListComponent extends DynamicFormControlComponent implements OnInit {

  @Input() group: UntypedFormGroup;
  @Input() model: any;

  @Output() blur: EventEmitter<any> = new EventEmitter<any>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();
  @Output() focus: EventEmitter<any> = new EventEmitter<any>();

  public items: ListItem[][] = [];
  public showLoadMore$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  protected optionsList: VocabularyEntry[] = [];
  private nextPageInfo: PageInfo;

  constructor(private vocabularyService: VocabularyService,
              private cdr: ChangeDetectorRef,
              private formBuilderService: FormBuilderService,
              protected layoutService: DynamicFormLayoutService,
              protected validationService: DynamicFormValidationService
  ) {
    super(layoutService, validationService);
  }

  /**
   * Initialize the component, setting up the field options
   */
  ngOnInit() {
    if (this.model.vocabularyOptions && hasValue(this.model.vocabularyOptions.name)) {
      this.initOptionsFromVocabulary();
    }
  }

  /**
   * Emits a blur event containing a given value.
   * @param event The value to emit.
   */
  onBlur(event: Event) {
    this.blur.emit(event);
  }

  /**
   * Emits a focus event containing a given value.
   * @param event The value to emit.
   */
  onFocus(event: Event) {
    this.focus.emit(event);
  }

  /**
   * Updates model value with the current value
   * @param event The change event.
   */
  onChange(event: Event) {
    const target = event.target as any;
    if (this.model.repeatable) {
      // Target tabindex coincide with the array index of the value into the authority list
      const entry: VocabularyEntry = this.optionsList[target.tabIndex];
      if (target.checked) {
        this.model.valueUpdates.next(entry);
      } else {
        const newValue = [];
        this.model.value
          .filter((item) => item.value !== entry.value)
          .forEach((item) => newValue.push(item));
        this.model.valueUpdates.next(newValue);
      }
    } else {
      (this.model as DynamicListRadioGroupModel).value = this.optionsList[target.value];
    }
    this.change.emit(event);
  }

  /**
   * Setting up the field options from vocabulary
   */
  protected initOptionsFromVocabulary() {
    if (this.model.vocabularyOptions.name && this.model.vocabularyOptions.name.length > 0) {
      const listGroup = this.group.controls[this.model.id] as UntypedFormGroup;
      if (this.model.repeatable && this.model.required) {
        listGroup.addValidators(this.hasAtLeastOneVocabularyEntry());
      }

      this.nextPageInfo = new PageInfo({
        elementsPerPage: 20, currentPage: 1,
      } as PageInfo);

      this.loadEntries(listGroup);
    }
  }

  /**
   * Checks if at least one {@link VocabularyEntry} has been selected.
   */
  hasAtLeastOneVocabularyEntry(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control && control.value && Object.values(control.value).find((checked: boolean) => checked === true) ? null : this.model.errorMessages;
    };
  }

  /**
   * Update current page state to keep track of which one to load next
   * @param response
   */
  setPaginationInfo(response: PaginatedList<VocabularyEntry>) {
    if (response.pageInfo.currentPage < response.pageInfo.totalPages) {
      this.nextPageInfo = Object.assign(new PageInfo(), response.pageInfo,  { currentPage: response.currentPage + 1 });
      this.showLoadMore$.next(true);
    } else {
      this.showLoadMore$.next(false);
    }
  }

  /**
   * Load entries page
   *
   * @param listGroup
   */
  loadEntries(listGroup?: UntypedFormGroup) {
    if (!hasValue(listGroup)) {
      listGroup = this.group.controls[this.model.id] as UntypedFormGroup;
    }

    this.vocabularyService.getVocabularyEntries(this.model.vocabularyOptions, this.nextPageInfo).pipe(
      getFirstSucceededRemoteDataPayload(),
      tap((response) => this.setPaginationInfo(response)),
      map(entries => entries.page),
    ).subscribe((allEntries: VocabularyEntry[]) => {
      this.optionsList = [...this.optionsList, ...allEntries];
      let groupCounter = (this.items.length > 0) ? (this.items.length - 1) : 0;
      let itemsPerGroup = 0;
      let tempList: ListItem[] = [];

      // Make a list of available options (checkbox/radio) and split in groups of 'model.groupLength'
      allEntries.forEach((option: VocabularyEntry, key: number) => {
        const value = option.authority || option.value;
        const checked: boolean = isNotEmpty(findKey(
          this.model.value,
          (v) => v?.value === option.value));

        const item: ListItem = {
          id: `${this.model.id}_${value}`,
          label: option.display,
          value: checked,
          index: key,
        };
        if (this.model.repeatable) {
          this.formBuilderService.addFormGroupControl(listGroup, (this.model as DynamicListCheckboxGroupModel), new DynamicCheckboxModel(item));
        } else {
          (this.model as DynamicListRadioGroupModel).options.push({
            label: item.label,
            value: option,
          });
        }
        tempList.push(item);
        itemsPerGroup++;
        this.items[groupCounter] = tempList;
        if (itemsPerGroup === this.model.groupLength) {
          groupCounter++;
          itemsPerGroup = 0;
          tempList = [];
        }
      });
      this.cdr.markForCheck();
    });
  }
}
