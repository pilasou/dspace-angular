import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ImportExternalPageComponent } from './import-external-page.component';
import { ThemeService } from '../shared/theme-support/theme.service';
import { getMockThemeService } from '../shared/mocks/theme-service.mock';
import { ActivatedRoute } from '@angular/router';
import { ActivatedRouteStub } from '../shared/testing/active-router.stub';
import { SearchConfigurationService } from '../core/shared/search/search-configuration.service';
import {
  ThemedSubmissionImportExternalComponent
} from '../submission/import-external/themed-submission-import-external.component';

describe('ImportExternalPageComponent', () => {
  let component: ImportExternalPageComponent;
  let fixture: ComponentFixture<ImportExternalPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [ImportExternalPageComponent],
    providers: [
        { provide: ThemeService, useValue: getMockThemeService() },
        { provide: ActivatedRoute, useValue: new ActivatedRouteStub() },
      { provide: SearchConfigurationService, useValue: {}},
    ],
    schemas: [NO_ERRORS_SCHEMA]
})
      .overrideComponent(ImportExternalPageComponent, {
          remove: {
            imports: [ThemedSubmissionImportExternalComponent]
          }
        }
      )
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportExternalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create ImportExternalPageComponent', () => {
    expect(component).toBeTruthy();
  });
});
