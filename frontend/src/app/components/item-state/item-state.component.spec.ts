import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemStateComponent } from './item-state.component';

describe('ItemStateComponent', () => {
  let component: ItemStateComponent;
  let fixture: ComponentFixture<ItemStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemStateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
