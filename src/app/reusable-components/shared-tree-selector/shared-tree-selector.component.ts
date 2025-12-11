import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
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
import { TranslateService } from "@ngx-translate/core";
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
export class SharedTreeSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title: string = "Select Items";
  @Input() placeholder: string = "Select...";
  @Input() otherFieldPlaceholder: string = "Specify Other...";
  @Input() selectAllLabel: string = "Select All";
  @Input() isRequired: boolean = false;
  @Input() fetchedData: TreeNode[] = [];
  @Input() cancelLabel: string = "Cancel";
  @Input() okLabel: string = "OK";
  @Input() currentLang: string = "en";

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
  selectedNodes: any; // Working state for dialog selections
  committedNodes: TreeNode[] = []; // Committed state for displaying chips
  private unsubscribe: Subscription[] = [];
  private isSelectAllProcessing: boolean = false;

  constructor(private translate: TranslateService) {} 
  ngOnInit(): void {
    // Initialize committed state with initial selected nodes first
    this.committedNodes = [...(this.initialSelectedNodes || [])];
    this.loadData();
    this.handleWindowResize();
    this.currentLang = this.translate.currentLang;
    console.log(this.currentLang);
  }

  ngOnChanges(): void {
    // When inputs change (e.g., fetched data or initial selections), rebuild and re-sync
    if (this.fetchedData) {
      this.loadData();
    }
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

    // Sync committed selections with the currently available tree nodes
    this.syncCommittedWithCurrentTree();

    // Initialize working state from committed state
    this.reApplySelection();
  }

  /**
   * Add "Other" nodes at desired hierarchy levels with de-duplication.
   * We want:
   * - Exactly ONE "Other" at the parent (level 0, under Select All)
   * - Exactly ONE "Other" inside each top-level parent (level 1) to add a child for that parent
   * If the API already returns an "Other" item, we convert it into an input-capable node
   * instead of adding a duplicate.
   */
  addOtherOption(nodes: TreeNode[], level: number = 0): TreeNode[] {
    if (!nodes) return [];
    return nodes.map((node) => {
      if (node.children && node.children.length > 0) {
        node.children = this.addOtherOption(node.children, level + 1);
      }

      // Helper to detect an existing "Other" child (either from API or previously added)
      const hasExistingOtherIndex =
        (node.children || []).findIndex((child: any) => {
          if (child?.isOther === true) return true;
          const lbl = (child?.label || "").toString().trim().toLowerCase();
          // Match common "other" labels (English/Arabic)
          return lbl === "other" || lbl === "others" || lbl === "أخرى" || lbl === "اخرى";
        });

      // If an "Other" exists already, convert it into an input-capable "isOther" node
      if (hasExistingOtherIndex !== -1) {
        const existing = (node.children as any[])[hasExistingOtherIndex] as any;
        existing.isOther = true;
        existing.selectable = false;
        existing.data = { ...(existing.data || {}), label: existing.label };
      } else if (level === 0 || level === 1) {
        // Otherwise, append exactly one "Other" at this level
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
   * Re-apply committed nodes to working state (used when dialog opens or cancels)
   */
  reApplySelection(): void {
    if (!this.committedNodes || this.committedNodes.length === 0) {
      this.selectedNodes = [];
      return;
    }

    // Flatten the entire tree (including "Select All") to easily find nodes by key
    const allNodes = this.flattenTree(this.nodes[0]);

    // For each committed node, try to find it in the current tree
    const reSelectedNodes: TreeNode[] = [];
    for (const committedNode of this.committedNodes) {
      const match = allNodes.find(n => n.key === committedNode.key);
      if (match) {
        // If it's an "Other" node with custom input, restore that input
        if (match.isOther && committedNode.data?.customInput) {
          match.data.customInput = committedNode.data.customInput;
        }
        reSelectedNodes.push(match);
      }
    }

    this.selectedNodes = reSelectedNodes;
    this.updateSelectAllState();
  }

  onKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    
    // Allow backspace, delete, arrow keys, etc.
    if (event.ctrlKey || event.metaKey || char.length > 1) {
      return true;
    }
    
    // Check if character is valid for current language
    if (this.currentLang === 'ar') {
      // Allow Arabic letters and spaces
      const isValidArabic = /[\u0600-\u06FF\s]/.test(char);
      if (!isValidArabic) {
        event.preventDefault();
        return false;
      }
    } else {
      // Allow English letters and spaces
      const isValidEnglish = /[a-zA-Z\s]/.test(char);
      if (!isValidEnglish) {
        event.preventDefault();
        return false;
      }
    }
    
    return true;
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

  /**
   * Returns filtered committed nodes that should be displayed as chips
   * Excludes the "selectAll" node and provides display labels
   */
  getDisplayableSelectedNodes(): TreeNode[] {
    if (!this.committedNodes || this.committedNodes.length === 0) {
      return [];
    }
    
    return this.committedNodes.filter((node: TreeNode) => node.key !== "selectAll");
  }

  /**
   * Removes a specific node from the committed selection when clicking a chip's remove icon
   */
  onRemoveChip(node: TreeNode): void {
    if (!this.committedNodes) return;
    
    this.committedNodes = this.committedNodes.filter(
      (committedNode: TreeNode) => committedNode.key !== node.key
    );
    
    // Check if we have any actual selections left (excluding selectAll)
    const actualSelections = this.committedNodes.filter(n => n.key !== "selectAll");
    
    // If no actual selections left, also remove the selectAll node
    if (actualSelections.length === 0) {
      this.committedNodes = this.committedNodes.filter(n => n.key !== "selectAll");
    }
    
    // Emit the updated committed selection
    this.nodesSelected.emit(this.committedNodes);
  }

  selectedNodesLabel(): string {
    if (this.committedNodes && this.committedNodes.length > 0) {
      const filteredNodes = this.committedNodes.filter(
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
    // Initialize working state with committed state when opening dialog
    this.reApplySelection();
    this.dialogVisible = true;
  }

  onOk() {
    this.dialogVisible = false;
    // Commit the working state to committed state
    this.committedNodes = [...(this.selectedNodes || [])];
    this.nodesSelected.emit(this.committedNodes);
  }

  onCancel() {
    this.dialogVisible = false;
    // Reset working state to the committed state (don't emit since nothing committed)
    this.reApplySelection();
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

  /**
   * Ensures committedNodes only contains nodes that still exist in the current tree.
   * Also maps them to the live tree nodes so labels stay up to date.
   */
  private syncCommittedWithCurrentTree(): void {
    if (!this.committedNodes || this.committedNodes.length === 0 || !this.nodes || this.nodes.length === 0) {
      return;
    }
    const allNodes = this.flattenTree(this.nodes[0]);
    const validMap = new Map<string | number, TreeNode>();
    for (const node of allNodes) {
      if (node.key !== "selectAll") {
        validMap.set(node.key as any, node);
      }
    }
    const nextCommitted: TreeNode[] = [];
    for (const committed of this.committedNodes) {
      const live = validMap.get(committed.key as any);
      if (live) {
        // Preserve custom input for "Other" if somehow present
        if ((live as any).isOther && committed.data?.customInput) {
          live.data = { ...(live.data || {}), customInput: committed.data.customInput };
        }
        nextCommitted.push(live);
      }
    }
    this.committedNodes = nextCommitted;
  }
}
