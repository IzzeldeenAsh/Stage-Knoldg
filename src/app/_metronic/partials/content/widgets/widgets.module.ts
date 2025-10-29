import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
// Advanced Tables
import { AdvanceTablesWidget1Component } from './advance-tables/advance-tables-widget1/advance-tables-widget1.component';
import { AdvanceTablesWidget2Component } from './advance-tables/advance-tables-widget2/advance-tables-widget2.component';
import { AdvanceTablesWidget7Component } from './advance-tables/advance-tables-widget7/advance-tables-widget7.component';
// Base Tables
import { BaseTablesWidget1Component } from './base-tables/base-tables-widget1/base-tables-widget1.component';
import { BaseTablesWidget2Component } from './base-tables/base-tables-widget2/base-tables-widget2.component';
import { BaseTablesWidget6Component } from './base-tables/base-tables-widget6/base-tables-widget6.component';
// Lists
import { ListsWidget1Component } from './lists/lists-widget1/lists-widget1.component';
import { ListsWidget3Component } from './lists/lists-widget3/lists-widget3.component';
import { ListsWidget4Component } from './lists/lists-widget4/lists-widget4.component';
import { ListsWidget8Component } from './lists/lists-widget8/lists-widget8.component';
// Mixed
import { MixedWidget1Component } from './mixed/mixed-widget1/mixed-widget1.component';
import { MixedWidget4Component } from './mixed/mixed-widget4/mixed-widget4.component';
import { MixedWidget5Component } from './mixed/mixed-widget5/mixed-widget5.component';
// Tiles
import { TilesWidget3Component } from './tiles/tiles-widget3/tiles-widget3.component';
import { TilesWidget10Component } from './tiles/tiles-widget10/tiles-widget10.component';
import { TilesWidget11Component } from './tiles/tiles-widget11/tiles-widget11.component';
import { TilesWidget12Component } from './tiles/tiles-widget12/tiles-widget12.component';
import { TilesWidget13Component } from './tiles/tiles-widget13/tiles-widget13.component';
import { TilesWidget14Component } from './tiles/tiles-widget14/tiles-widget14.component';
// Other
import { DropdownMenusModule } from '../dropdown-menus/dropdown-menus.module';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ListsWidget2Component } from './lists/lists-widget2/lists-widget2.component';
import { ListsWidget5Component } from './lists/lists-widget5/lists-widget5.component';
import { ListsWidget6Component } from './lists/lists-widget6/lists-widget6.component';
import { ListsWidget7Component } from './lists/lists-widget7/lists-widget7.component';
import { FeedsWidget2Component } from './feeds/feeds-widget2/feeds-widget2.component';
import { FeedsWidget3Component } from './feeds/feeds-widget3/feeds-widget3.component';
import { FeedsWidget4Component } from './feeds/feeds-widget4/feeds-widget4.component';
import { FeedsWidget5Component } from './feeds/feeds-widget5/feeds-widget5.component';
import { FeedsWidget6Component } from './feeds/feeds-widget6/feeds-widget6.component';
import { TablesWidget1Component } from './tables/tables-widget1/tables-widget1.component';
import { TablesWidget2Component } from './tables/tables-widget2/tables-widget2.component';
import { TablesWidget3Component } from './tables/tables-widget3/tables-widget3.component';
import { TablesWidget4Component } from './tables/tables-widget4/tables-widget4.component';
import { TablesWidget5Component } from './tables/tables-widget5/tables-widget5.component';
import { TablesWidget6Component } from './tables/tables-widget6/tables-widget6.component';
import { TablesWidget7Component } from './tables/tables-widget7/tables-widget7.component';
import { TablesWidget8Component } from './tables/tables-widget8/tables-widget8.component';
import { TablesWidget9Component } from './tables/tables-widget9/tables-widget9.component';
import { TablesWidget10Component } from './tables/tables-widget10/tables-widget10.component';
import { TablesWidget11Component } from './tables/tables-widget11/tables-widget11.component';
import { TablesWidget12Component } from './tables/tables-widget12/tables-widget12.component';
import { TablesWidget13Component } from './tables/tables-widget13/tables-widget13.component';
import { TablesWidget14Component } from './tables/tables-widget14/tables-widget14.component';
// new
import { CardsWidget20Component } from './_new/cards/cards-widget20/cards-widget20.component';
import { CardsWidget17Component } from './_new/cards/cards-widget17/cards-widget17.component';
import { ListsWidget26Component } from './_new/lists/lists-widget26/lists-widget26.component';
import { EngageWidget10Component } from './_new/engage/engage-widget10/engage-widget10.component';
import { CardsWidget7Component } from './_new/cards/cards-widget7/cards-widget7.component';
import { TablesWidget16Component } from './_new/tables/tables-widget16/tables-widget16.component';
import { CardsWidget18Component } from './_new/cards/cards-widget18/cards-widget18.component';
import { SharedModule } from "../../../shared/shared.module";
@NgModule({
  declarations: [
    // Advanced Tables
    AdvanceTablesWidget1Component,
    AdvanceTablesWidget2Component,
    AdvanceTablesWidget7Component,
    // Base Tables
    BaseTablesWidget1Component,
    BaseTablesWidget2Component,
    BaseTablesWidget6Component,
    // Lists
    ListsWidget1Component,
    ListsWidget3Component,
    ListsWidget4Component,
    ListsWidget8Component,
    // Mixed
    MixedWidget1Component,
    MixedWidget4Component,
    MixedWidget5Component,
    // Tiles
    TilesWidget3Component,
    TilesWidget10Component,
    TilesWidget11Component,
    TilesWidget12Component,
    TilesWidget13Component,
    TilesWidget14Component,
    // Other
    ListsWidget2Component,
    ListsWidget5Component,
    ListsWidget6Component,
    ListsWidget7Component,
    FeedsWidget2Component,
    FeedsWidget3Component,
    FeedsWidget4Component,
    FeedsWidget5Component,
    FeedsWidget6Component,
    TablesWidget1Component,
    TablesWidget2Component,
    TablesWidget3Component,
    TablesWidget4Component,
    TablesWidget5Component,
    TablesWidget6Component,
    TablesWidget7Component,
    TablesWidget8Component,
    TablesWidget9Component,
    TablesWidget10Component,
    TablesWidget11Component,
    TablesWidget12Component,
    TablesWidget13Component,
    TablesWidget14Component,
    CardsWidget20Component,
    CardsWidget17Component,
    ListsWidget26Component,
    EngageWidget10Component,
    CardsWidget7Component,
    TablesWidget16Component,
    CardsWidget18Component,
  ],
  imports: [
    CommonModule,
    DropdownMenusModule,
    InlineSVGModule,
    NgbDropdownModule,
    SharedModule
  ],
  exports: [
    // Advanced Tables
    AdvanceTablesWidget1Component,
    AdvanceTablesWidget2Component,
    AdvanceTablesWidget7Component,
    // Base Tables
    BaseTablesWidget1Component,
    BaseTablesWidget2Component,
    BaseTablesWidget6Component,
    // Lists
    ListsWidget1Component,
    ListsWidget3Component,
    ListsWidget4Component,
    ListsWidget8Component,
    // Mixed
    MixedWidget1Component,
    MixedWidget4Component,
    MixedWidget5Component,
    // Tiles
    TilesWidget3Component,
    TilesWidget10Component,
    TilesWidget11Component,
    TilesWidget12Component,
    TilesWidget13Component,
    TilesWidget14Component,
    // Other
    ListsWidget2Component,
    ListsWidget5Component,
    ListsWidget6Component,
    ListsWidget7Component,
    FeedsWidget2Component,
    FeedsWidget3Component,
    FeedsWidget4Component,
    FeedsWidget5Component,
    FeedsWidget6Component,
    TablesWidget1Component,
    TablesWidget2Component,
    TablesWidget3Component,
    TablesWidget4Component,
    TablesWidget5Component,
    TablesWidget6Component,
    TablesWidget7Component,
    TablesWidget8Component,
    TablesWidget9Component,
    TablesWidget10Component,
    TablesWidget11Component,
    TablesWidget12Component,
    TablesWidget13Component,
    TablesWidget14Component,
    // new
    CardsWidget20Component,
    CardsWidget17Component,
    ListsWidget26Component,
    EngageWidget10Component,
    CardsWidget7Component,
    TablesWidget16Component,
    CardsWidget18Component
  ],
})
export class WidgetsModule {}
