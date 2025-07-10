import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchStateComponent } from './search-state.component';

describe('SearchStateComponent', () => {
  let component: SearchStateComponent;
  let fixture: ComponentFixture<SearchStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchStateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
