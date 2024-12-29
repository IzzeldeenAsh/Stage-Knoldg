import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Observable,
  Subscription,
  BehaviorSubject,
  fromEvent,
  map,
  startWith,
} from "rxjs";
import { DialogModule } from "primeng/dialog";
import { TreeModule } from "primeng/tree";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { TreeNode } from "primeng/api";

@Component({
  selector: "app-industry-selector",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TreeModule,
    FormsModule,
    InputTextModule,
  ],
  template: `
    <p-dialog
      [header]="title"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: dialogWidth, 'max-height': '100vh', overflow: 'hidden' }"
      [contentStyle]="{ 'max-height': 'calc(90vh - 100px)', overflow: 'auto' }"
      appendTo="body"
    >
      <div class="tree-container">
        <p-tree
          class="industry-tree"
          [style]="{ 'max-height': '100%', overflow: 'auto' }"
          [value]="nodes"
          selectionMode="single"
          [(selection)]="selectedNode"
          [metaKeySelection]="false"
          [filter]="true"
          filterMode="strict"
          [loading]="isLoading$ | async"
          (onNodeSelect)="onNodeSelect($event)"
        >
        </p-tree>
      </div>
      <p-footer>
        <div class="p-2 d-flex justify-content-between align-items-center">
          <a
            class="btn btn-sm btn-secondary btn-shadow cursor-pointer"
            (click)="onCancel()"
          >
            {{ cancelLabel }}
          </a>
          <a
            class="btn btn-sm btn-primary m-1 btn-shadow cursor-pointer"
            (click)="onOk()"
            [class.disabled]="!isValidSelection()"
          >
            {{ okLabel }}
          </a>
        </div>
      </p-footer>
    </p-dialog>

    <div class="w-100">
    <label class="d-flex align-items-center fs-5 fw-semibold mb-4">
      <span class="required">{{ title }}</span>
      <span
        class="ms-1"
        data-bs-toggle="tooltip"
        aria-label="Select your app category"
        data-bs-original-title="Select your app category"
        data-kt-initialized="1"
      >
        <i class="ki-duotone ki-information-5 text-gray-500 fs-6">
          <span class="path1"></span><span class="path2"></span
          ><span class="path3"></span>
        </i>
      </span>
    </label>
      <input
        type="text"
        pInputText
        class="form-control form-control-lg form-control-solid"
        [readonly]="true"
        [placeholder]="placeholder"
        (click)="showDialog()"
        [value]="selectedNodeLabel()"
      />
    </div>
  `,
  styles: [`
    .responsive-dialog {
    width: 50vw;
    max-height: 90vh;
    overflow: hidden;
  }
  
  @media (max-width: 768px) {
    .responsive-dialog {
      width: 100vw;
    }
  }
  .tree-container{
    height: 500px;
    max-height:calc(-100px + 80vh)
  }
  .max-width-200px{
    max-width: 250px;
    width: 250px;
  }
  .logo-placeholder{
    background-size: contain;
    background-position: center;
  }
  .fit-content{
    width: fit-content;
  }
  .mb-3 {
    transition: all 300ms ease-in-out;
  } 
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndustrySelectorComponent implements OnInit, OnDestroy {
  @Input() title: string = "Select Industry";
  @Input() placeholder: string = "Select Industry...";
  @Input() isRequired: boolean = false;
  @Input() fetchedData: TreeNode[] = [];
  @Input() cancelLabel: string = "Cancel";
  @Input() okLabel: string = "OK";

  @Input() set initialSelectedNode(node: TreeNode | undefined) {
    if (node) {
      this.selectedNode = node;
    }
  }

  @Output() nodeSelected = new EventEmitter<TreeNode>();

  dialogVisible = false;
  dialogWidth: string = "50vw";
  isLoading$ = new BehaviorSubject<boolean>(false);
  nodes: TreeNode[] = [];
  selectedNode:any;
  private unsubscribe: Subscription[] = [];

  ngOnInit(): void {
    this.loadData();
    this.handleWindowResize();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  loadData() {
    if (!this.fetchedData) {
      console.error("fetchedData not provided or empty.");
      return;
    }

    this.nodes = this.fetchedData;
  }

  selectedNodeLabel(): string {
    if (this.selectedNode) {
      return this.selectedNode.label || '';
    }
    return "";
  }

  showDialog() {
    this.dialogVisible = true;
  }

  onOk() {
    if (this.isValidSelection() && this.selectedNode) {
      this.dialogVisible = false;
      this.nodeSelected.emit(this.selectedNode);
    }
  }

  onCancel() {
    this.dialogVisible = false;
  }

  onNodeSelect(event: any) {
    // Only allow selection if it's a child node (no children)
    if (event.node.children && event.node.children.length > 0) {
      this.selectedNode = undefined;
    }
  }

  isValidSelection(): boolean {
    return !!this.selectedNode && (!this.selectedNode.children || this.selectedNode.children.length === 0);
  }

  handleWindowResize() {
    const screenwidth$ = fromEvent(window, "resize").pipe(
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    );

    const sub = screenwidth$.subscribe((width) => {
      this.dialogWidth = width < 768 ? "100vw" : "70vw";
    });
    this.unsubscribe.push(sub);
  }
} 