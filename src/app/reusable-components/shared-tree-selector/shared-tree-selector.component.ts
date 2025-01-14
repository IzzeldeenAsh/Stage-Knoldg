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
import { TreeNode } from "./TreeNode";
import { ChipModule } from 'primeng/chip';
@Component({
  selector: "shared-tree-selector",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    TreeModule,
    FormsModule,
    InputTextModule,
    ChipModule,
  ],
  templateUrl: "./shared-tree-selector.component.html",
  styleUrls: ["./shared-tree-selector.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedTreeSelectorComponent implements OnInit, OnDestroy {
  @Input() title: string = "Select Items";
  @Input() placeholder: string = "Select...";
  @Input() otherFieldPlaceholder: string = "Specify Other...";
  @Input() selectAllLabel: string = "Select All";
  @Input() isRequired: boolean = false;
  @Input() fetchedData: TreeNode[] = [];
  @Input() cancelLabel: string = "Cancel";
  @Input() okLabel: string = "OK";

  /**
   * Previously selected nodes that should be reselected when the dialog is shown again.
   * These should be an array of TreeNode objects that were emitted previously.
   */
  @Input() initialSelectedNodes: TreeNode[] = [];

  @Output() nodesSelected = new EventEmitter<TreeNode[]>();

  dialogVisible = false;
  dialogWidth: string = "50vw";
  isLoading$ = new BehaviorSubject<boolean>(false);
  nodes: TreeNode[] = [];
  selectedNodes: any;
  private unsubscribe: Subscription[] = [];
  private isSelectAllProcessing: boolean = false;

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

    // Create the "Select All" node
    const selectAllNode: TreeNode = {
      key: "selectAll",
      label: this.selectAllLabel,
      data: { key: "selectAll", label: this.selectAllLabel },
      children: this.fetchedData,
      expanded: true,
    };
    this.nodes = this.addOtherOption([selectAllNode]);

    // Re-apply any previous selections
    this.reApplySelection();
  }

  /**
   * Add "Other" nodes at desired hierarchy levels.
   * This demo adds Other nodes at levels 0 & 1.
   */
  addOtherOption(nodes: TreeNode[], level: number = 0): TreeNode[] {
    if (!nodes) return [];
    return nodes.map((node) => {
      if (node.children && node.children.length > 0) {
        node.children = this.addOtherOption(node.children, level + 1);
      }

      if (level === 0 || level === 1) {
        const otherNode: TreeNode = {
          key: `${node.key}-other`,
          label: "Other",
          data: { key: `${node.key}-other`, label: "Other" },
          isOther: true,
          selectable: false,
          children: [],
        };
        node.children = [...(node.children || []), otherNode];
      }

      return node;
    });
  }

  /**
   * Re-apply previously selected nodes (and any custom "Other" inputs) when returning to this step.
   */
  reApplySelection(): void {
    if (!this.initialSelectedNodes || this.initialSelectedNodes.length === 0) {
      return;
    }

    // Flatten the entire tree (including "Select All") to easily find nodes by key
    const allNodes = this.flattenTree(this.nodes[0]);

    const initialSelectedKeys = new Set(this.initialSelectedNodes.map(n => n.key));

    // For each initially selected node, try to find it in the current tree
    const reSelectedNodes: TreeNode[] = [];
    for (const initNode of this.initialSelectedNodes) {
      const match = allNodes.find(n => n.key === initNode.key);
      if (match) {
        // If it's an "Other" node with custom input, restore that input
        if (match.isOther && initNode.data?.customInput) {
          match.data.customInput = initNode.data.customInput;
        }
        reSelectedNodes.push(match);
      }
    }

    this.selectedNodes = reSelectedNodes;
    this.updateSelectAllState();
  }

  onOtherInput(node: TreeNode): void {
    if (node.data.customInput && node.data.customInput.trim() !== "") {
      // If input not empty, ensure the node is selected
      if (!this.selectedNodes.some((selectedNode: any) => selectedNode.key === node.key)) {
        this.selectedNodes = [...this.selectedNodes, node];
      }
    } else {
      // If input empty, deselect the node
      this.selectedNodes = this.selectedNodes.filter(
        (selectedNode: any) => selectedNode.key !== node.key
      );
    }
    this.updateSelectAllState();
  }

  selectedNodesLabel(): string {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      const filteredNodes = this.selectedNodes.filter(
        (node: TreeNode) => node.key !== "selectAll"
      );
      return filteredNodes
        .map((node: TreeNode) => {
          if ((node as any).isOther) {
            return node.data.customInput ? node.data.customInput : node.label;
          } else {
            return node.label;
          }
        })
        .join(", ");
    } else {
      return "";
    }
  }

  showDialog() {
    this.dialogVisible = true;
  }

  onOk() {
    this.dialogVisible = false;
    this.nodesSelected.emit(this.selectedNodes);
  }

  onCancel() {
    this.dialogVisible = false;
  }

  onNodeSelect(event: any) {
    if (this.isSelectAllProcessing) return;
    if (event.node.key === "selectAll") {
      this.toggleSelectAll(true);
    } else {
      this.updateSelectAllState();
    }
  }

  onNodeUnselect(event: any) {
    if (this.isSelectAllProcessing) return;
    if (event.node.key === "selectAll") {
      this.toggleSelectAll(false);
    } else {
      this.updateSelectAllState();
    }
  }

  toggleSelectAll(isChecked: boolean) {
    if (this.isSelectAllProcessing) return;
    this.isSelectAllProcessing = true;

    if (isChecked && this.nodes.length > 0) {
      const allNodes = this.flattenTree(this.nodes[0]);
      this.selectedNodes = allNodes;
    } else {
      this.selectedNodes = [];
    }

    this.isSelectAllProcessing = false;
  }

  updateSelectAllState() {
    if (!this.nodes || this.nodes.length === 0) return;
    const allChildNodes = this.getAllChildNodes(this.nodes);
    const selectedKeys = new Set(this.selectedNodes.map((node: TreeNode) => node.key));

    const isAllSelected = allChildNodes.every((node) => selectedKeys.has(node.key));
    const selectAllNode = this.nodes.find((node: TreeNode) => node.key === "selectAll");

    if (isAllSelected) {
      if (selectAllNode && !selectedKeys.has(selectAllNode.key)) {
        this.isSelectAllProcessing = true;
        this.selectedNodes = [selectAllNode, ...this.selectedNodes];
        this.isSelectAllProcessing = false;
      }
    } else {
      if (selectAllNode && selectedKeys.has(selectAllNode.key)) {
        this.isSelectAllProcessing = true;
        this.selectedNodes = this.selectedNodes.filter(
          (node: TreeNode) => node.key !== "selectAll"
        );
        this.isSelectAllProcessing = false;
      }
    }
  }

  flattenTree(node: TreeNode, allNodes: TreeNode[] = []): TreeNode[] {
    allNodes.push(node);
    if (node.children) {
      node.children.forEach((childNode) => this.flattenTree(childNode, allNodes));
    }
    return allNodes;
  }

  private getAllChildNodes(nodes: TreeNode[]): TreeNode[] {
    let allNodes: TreeNode[] = [];
    nodes.forEach((node) => {
      if (node.key !== "selectAll") {
        allNodes.push(node);
        if (node.children && node.children.length > 0) {
          allNodes = allNodes.concat(this.getAllChildNodes(node.children));
        }
      }
    });
    return allNodes;
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
