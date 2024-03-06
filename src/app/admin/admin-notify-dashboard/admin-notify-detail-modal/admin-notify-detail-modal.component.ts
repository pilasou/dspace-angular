import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminNotifyMessage } from '../models/admin-notify-message.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { MissingTranslationHelper } from '../../../shared/translate/missing-translation.helper';
import { fadeIn } from '../../../shared/animations/fade';

@Component({
  selector: 'ds-admin-notify-detail-modal',
  templateUrl: './admin-notify-detail-modal.component.html',
  animations: [
    fadeIn
  ]
})
/**
 * Component for detailed view of LDN messages displayed in search result in AdminNotifyDashboardComponent
 */

export class AdminNotifyDetailModalComponent {
  @Input() notifyMessage: AdminNotifyMessage;
  @Input() notifyMessageKeys: string[];

  /**
   * An event fired when the modal is closed
   */
  @Output()
  response = new EventEmitter<boolean>();

  public isCoarMessageVisible = false;


  constructor(protected activeModal: NgbActiveModal,
              public translationsService: TranslateService) {
    this.translationsService.missingTranslationHandler = new MissingTranslationHelper();
  }


  /**
   * Close the modal and set the response to true so RootComponent knows the modal was closed
   */
  closeModal() {
    this.activeModal.close();
    this.response.emit(true);
  }

  toggleCoarMessage() {
    this.isCoarMessageVisible = !this.isCoarMessageVisible;
  }
}