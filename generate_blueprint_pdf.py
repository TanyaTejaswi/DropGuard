import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (on pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "DropGuard — Work Division, Day-by-Day Schedule & File Blueprint")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 742, letter[0] - 54, 742)
            
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 35, footer_text)
        self.drawString(54, 35, "CONFIDENTIAL — Academic Project Execution Blueprint (Team of 3)")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 47, letter[0] - 54, 47)
        self.restoreState()

def build_pdf(filename="DropGuard_Work_Division_and_Architecture.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#1E3A8A")    # Deep Navy
    SECONDARY = colors.HexColor("#0284C7")  # Sky Blue
    DARK_TEXT = colors.HexColor("#0F172A")  # Slate 900
    LIGHT_BG = colors.HexColor("#F8FAFC")   # Slate 50
    CARD_BORDER = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.5,
        textColor=DARK_TEXT,
        spaceAfter=5
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=DARK_TEXT
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )

    story = []

    # Title Banner
    story.append(Paragraph("DropGuard: Dropout Prediction & Counseling", title_style))
    story.append(Paragraph("Complete Work Division Blueprint, Day-by-Day Parallel Schedule & File Guide", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=0, spaceAfter=10))

    # Meta Table
    meta_data = [
        [
            Paragraph("<b>Target Domain:</b> Higher Education Early Warning", table_cell),
            Paragraph("<b>Team Size:</b> 3 Engineers", table_cell),
            Paragraph("<b>Architecture:</b> Contract-First / Decoupled", table_cell)
        ],
        [
            Paragraph("<b>Dataset:</b> UCI Student Performance / Dropout", table_cell),
            Paragraph("<b>Methodology:</b> Tabular ML + SHAP + LLM GenAI", table_cell),
            Paragraph("<b>Deliverable:</b> Model + 5-10 Test Memos + UI", table_cell)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[170, 150, 184])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # Section 1: Executive Philosophy
    story.append(Paragraph("1. Executive Philosophy: The Zero-Conflict Strategy", h1_style))
    story.append(Paragraph(
        "In collaborative AI projects, teams typically waste days waiting on one another: Frontend waits for backend API endpoints, "
        "and counseling modules wait for the ML model to be trained. <b>DropGuard eliminates bottlenecks using a Contract-First Architecture:</b> "
        "on Day 1, all 3 members agree on a single JSON schema (<code>contracts/student_schema.json</code>). From that moment forward, "
        "each member works completely in parallel inside their own isolated folder. <b>Zero waiting, zero merge conflicts, 100% independent development.</b>",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Section 2: DAY-BY-DAY PARALLEL SCHEDULE (REQUESTED FEATURE)
    story.append(Paragraph("2. Basic Day-by-Day Parallel Execution Plan (Who Does What in Parallel)", h1_style))
    story.append(Paragraph(
        "This master schedule shows exactly what all 3 members are doing on the exact same day without blocking each other:",
        body_style
    ))

    days_data = [
        [
            Paragraph("Timeline", table_header),
            Paragraph("Member 1 (ML & Data Lead)<br/><i>Folder: /ml_engine/</i>", table_header),
            Paragraph("Member 2 (AI Counseling Lead)<br/><i>Folder: /counseling_engine/</i>", table_header),
            Paragraph("Member 3 (Frontend & UI Lead)<br/><i>Folder: /frontend/</i>", table_header)
        ],
        [
            Paragraph("<b>DAY 1<br/>Alignment</b>", table_cell_bold),
            Paragraph("• Download UCI Dataset CSV.<br/>• Set up virtual environment and install packages (Pandas, Scikit-learn).", table_cell),
            Paragraph("• Review <code>mock_students.json</code>.<br/>• Set up Gemini/LLM API key and test basic Python connection.", table_cell),
            Paragraph("• Download HTML dashboard template (TailAdmin or Tabler).<br/>• Confirm template runs locally in browser.", table_cell)
        ],
        [
            Paragraph("<b>DAY 2<br/>Foundations</b>", table_cell_bold),
            Paragraph("• Perform Exploratory Data Analysis (EDA).<br/>• Clean missing values, encode categoricals, define target (Dropout=1).", table_cell),
            Paragraph("• Write counseling system prompt in <code>counselor_prompt.txt</code>.<br/>• Define tone: empathetic, professional advisor.", table_cell),
            Paragraph("• Clean up template navigation.<br/>• Build top KPI summary metric cards (Total Students, % At-Risk, Average GPA).", table_cell)
        ],
        [
            Paragraph("<b>DAY 3<br/>Core Build</b>", table_cell_bold),
            Paragraph("• Train baseline models (Logistic Regression, Random Forest, XGBoost).<br/>• Measure Recall & F1-score on test split.", table_cell),
            Paragraph("• Write <code>advisor.py</code> to feed student data into LLM.<br/>• Implement strict JSON output parsing for the 3 keys.", table_cell),
            Paragraph("• Write <code>app.js</code> to load <code>mock_students.json</code>.<br/>• Render student roster table with search & filter pills.", table_cell)
        ],
        [
            Paragraph("<b>DAY 4<br/>Deep Tech</b>", table_cell_bold),
            Paragraph("• Implement SHAP (<code>TreeExplainer</code>).<br/>• Convert SHAP values into top-3 human-readable risk strings.", table_cell),
            Paragraph("• Test prompt against edge cases (academic failure vs absenteeism vs financial hardship).<br/>• Refine prompt quality.", table_cell),
            Paragraph("• Build <code>charts.js</code>: Animated radial risk score meter + horizontal SHAP risk attribution bar chart.", table_cell)
        ],
        [
            Paragraph("<b>DAY 5<br/>Packaging</b>", table_cell_bold),
            Paragraph("• Package logic into <code>predict.py</code>: single function <code>predict_student(data)</code>.<br/>• Save <code>model.pkl</code>.", table_cell),
            Paragraph("• Run script on all 10 mock profiles.<br/>• Compile official deliverable file: <code>sample_counseling_notes.md</code>.", table_cell),
            Paragraph("• Build <code>modal.js</code>: Click student row to open detail drawer showing profile, SHAP chart & AI memo.<br/>• Add 'Print PDF' button.", table_cell)
        ],
        [
            Paragraph("<b>DAY 6<br/>Integration<br/>(30 mins)</b>", table_cell_bold),
            Paragraph("• Provide <code>model.pkl</code> and <code>predict.py</code> to <code>server/main.py</code>.", table_cell),
            Paragraph("• Connect <code>advisor.py</code> into <code>server/main.py</code> API endpoints.", table_cell),
            Paragraph("• Change 1 line in <code>app.js</code>: point fetch from mock JSON to <code>http://localhost:8000/api/students</code>.", table_cell)
        ],
        [
            Paragraph("<b>DAY 7<br/>Presentation</b>", table_cell_bold),
            Paragraph("• Record benchmark metrics table (Accuracy, Recall, F1) for project report.", table_cell),
            Paragraph("• Prepare slide showing sample before/after counseling memos for 3 persona types.", table_cell),
            Paragraph("• Rehearse live demonstration flow (Search student &rarr; inspect risk &rarr; generate & export memo).", table_cell)
        ]
    ]

    days_table = Table(days_data, colWidths=[65, 146, 146, 147])
    days_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 3.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(days_table)

    story.append(PageBreak())

    # Section 3: Non-Contradiction Matrix
    story.append(Paragraph("3. Non-Contradiction Matrix: Explicit Boundaries & Alignments", h1_style))
    story.append(Paragraph(
        "To ensure outputs from all 3 members fit together without contradictions, the following standards are strictly enforced:",
        body_style
    ))

    nc_data = [
        [
            Paragraph("Component / Metric", table_header),
            Paragraph("Member 1 (ML Engine)", table_header),
            Paragraph("Member 2 (Counseling AI)", table_header),
            Paragraph("Member 3 (Frontend UI)", table_header),
            Paragraph("Zero-Contradiction Guarantee", table_header)
        ],
        [
            Paragraph("<b>Risk Score & Scale</b>", table_cell_bold),
            Paragraph("Outputs float <code>0.00</code> to <code>1.00</code> (probability of dropout).", table_cell),
            Paragraph("Consumes float to contextualize urgency in prompt.", table_cell),
            Paragraph("Multiplies by 100 to show animated radial gauge (0%–100%).", table_cell),
            Paragraph("Exact mathematical scale ($[0,1]$). No confusion between grades and percentages.", table_cell)
        ],
        [
            Paragraph("<b>Risk Categorization</b>", table_cell_bold),
            Paragraph("Classifies strictly:<br/>• &ge;0.65 &rarr; <b>High</b><br/>• 0.35–0.64 &rarr; <b>Medium</b><br/>• &lt;0.35 &rarr; <b>Low</b>", table_cell),
            Paragraph("Uses exact strings: <code>'High'</code>, <code>'Medium'</code>, <code>'Low'</code> to adjust tone.", table_cell),
            Paragraph("Maps strings to badge colors:<br/>• High &rarr; Red<br/>• Medium &rarr; Yellow<br/>• Low &rarr; Green", table_cell),
            Paragraph("Identical threshold rules across all codebases. No contradictory thresholds.", table_cell)
        ],
        [
            Paragraph("<b>Risk Explanations (SHAP)</b>", table_cell_bold),
            Paragraph("Converts SHAP vectors into list of 3 plain English strings (e.g. <i>'16 unexcused absences'</i>).", table_cell),
            Paragraph("Directly injects the 3 string bullet points into LLM prompt.", table_cell),
            Paragraph("Renders the 3 bullet points inside the student drawer card.", table_cell),
            Paragraph("Member 2 & 3 never parse raw SHAP mathematical tensors; only readable strings.", table_cell)
        ],
        [
            Paragraph("<b>Counseling Memo Format</b>", table_cell_bold),
            Paragraph("Independent. Does not touch or care about counseling text generation.", table_cell),
            Paragraph("Guarantees strict JSON keys:<br/>• <code>summary</code><br/>• <code>action_items</code> (list)<br/>• <code>talking_points</code> (list)", table_cell),
            Paragraph("Pre-codes HTML containers to bind to these exact 3 keys.", table_cell),
            Paragraph("No unstructured text blobs. Zero parsing errors on the frontend.", table_cell)
        ],
        [
            Paragraph("<b>Student Identification</b>", table_cell_bold),
            Paragraph("Indexed by string ID: <code>'STU-101'</code>, <code>'STU-102'</code>...", table_cell),
            Paragraph("Takes ID in parameter to log counseling reports.", table_cell),
            Paragraph("Displays ID in search bar and table row keys.", table_cell),
            Paragraph("Single uniform identifier across dataset, backend, and DOM.", table_cell)
        ]
    ]

    nc_table = Table(nc_data, colWidths=[90, 105, 105, 105, 99])
    nc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(nc_table)
    story.append(Spacer(1, 10))

    # Section 4: File Ownership Table
    story.append(Paragraph("4. Complete Folder Hierarchy & File-by-File Ownership", h1_style))
    story.append(Paragraph("Every single file in the repository has one owner. No shared editing.", body_style))

    files_data = [
        [Paragraph("File Path", table_header), Paragraph("Owner", table_header), Paragraph("Exact Purpose & Functional Role", table_header)],
        [
            Paragraph("<b>contracts/student_schema.json</b>", table_cell),
            Paragraph("All (Day 1)", table_cell_bold),
            Paragraph("The universal JSON schema defining student data, risk outputs, SHAP strings, and memo keys.", table_cell)
        ],
        [
            Paragraph("<b>contracts/mock_students.json</b>", table_cell),
            Paragraph("All (Day 1)", table_cell_bold),
            Paragraph("10 realistic test student profiles used by Member 2 & 3 for independent testing from Day 1.", table_cell)
        ],
        [
            Paragraph("<b>ml_engine/data/student_data.csv</b>", table_cell),
            Paragraph("Member 1", table_cell_bold),
            Paragraph("Raw dataset downloaded from UCI repository (academic, demographic, attendance attributes).", table_cell)
        ],
        [
            Paragraph("<b>ml_engine/01_eda_and_training.ipynb</b>", table_cell),
            Paragraph("Member 1", table_cell_bold),
            Paragraph("Jupyter Notebook for exploratory analysis, feature importance, and model benchmarks.", table_cell)
        ],
        [
            Paragraph("<b>ml_engine/train_pipeline.py</b>", table_cell),
            Paragraph("Member 1", table_cell_bold),
            Paragraph("Automated training script: loads CSV, handles preprocessing/imputation, and trains XGBoost/RF.", table_cell)
        ],
        [
            Paragraph("<b>ml_engine/model.pkl</b>", table_cell),
            Paragraph("Member 1", table_cell_bold),
            Paragraph("Serialized trained model pipeline (classifier + preprocessor transformer object).", table_cell)
        ],
        [
            Paragraph("<b>ml_engine/predict.py</b>", table_cell),
            Paragraph("Member 1", table_cell_bold),
            Paragraph("Inference function. Takes raw student attributes, calculates risk probability, and runs SHAP.", table_cell)
        ],
        [
            Paragraph("<b>counseling_engine/prompts/counselor_prompt.txt</b>", table_cell),
            Paragraph("Member 2", table_cell_bold),
            Paragraph("System prompt template guiding the LLM on academic counseling tone and strict JSON output.", table_cell)
        ],
        [
            Paragraph("<b>counseling_engine/advisor.py</b>", table_cell),
            Paragraph("Member 2", table_cell_bold),
            Paragraph("Core GenAI module. Takes student profile + SHAP risk factors and calls Gemini/LLM API.", table_cell)
        ],
        [
            Paragraph("<b>counseling_engine/test_counseling.py</b>", table_cell),
            Paragraph("Member 2", table_cell_bold),
            Paragraph("Unit test running advisor.py against all 10 mock profiles, validating formatting and empathy.", table_cell)
        ],
        [
            Paragraph("<b>counseling_engine/sample_counseling_notes.md</b>", table_cell),
            Paragraph("Member 2", table_cell_bold),
            Paragraph("Official project deliverable: documented counseling intervention notes for 5–10 diverse test students.", table_cell)
        ],
        [
            Paragraph("<b>frontend/index.html</b>", table_cell),
            Paragraph("Member 3", table_cell_bold),
            Paragraph("Main dashboard: Sidebar navigation, top KPI summary cards, student table, and detail modal.", table_cell)
        ],
        [
            Paragraph("<b>frontend/styles.css</b>", table_cell),
            Paragraph("Member 3", table_cell_bold),
            Paragraph("Custom CSS theme, modern card shadows, status badges (Red/Yellow/Green), and responsive drawer.", table_cell)
        ],
        [
            Paragraph("<b>frontend/js/app.js</b>", table_cell),
            Paragraph("Member 3", table_cell_bold),
            Paragraph("Main UI controller. Fetches data, handles search/filtering by risk level, and updates table DOM.", table_cell)
        ],
        [
            Paragraph("<b>frontend/js/charts.js</b>", table_cell),
            Paragraph("Member 3", table_cell_bold),
            Paragraph("Chart.js / Plotly logic rendering the animated circular risk gauge and SHAP bar chart.", table_cell)
        ],
        [
            Paragraph("<b>frontend/js/modal.js</b>", table_cell),
            Paragraph("Member 3", table_cell_bold),
            Paragraph("Controls the student deep-dive modal: displays full profile, SHAP chart, and AI counseling memo.", table_cell)
        ],
        [
            Paragraph("<b>server/main.py</b>", table_cell),
            Paragraph("Shared (Final)", table_cell_bold),
            Paragraph("Lightweight FastAPI app (30 lines). Bridges predict.py and advisor.py into REST endpoints.", table_cell)
        ]
    ]

    files_table = Table(files_data, colWidths=[165, 80, 259])
    files_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(files_table)

    story.append(PageBreak())

    # Section 5: The 30-Minute Final Integration
    story.append(Paragraph("5. The 30-Minute Final Integration Protocol", h1_style))
    story.append(Paragraph(
        "On Day 6, combining all three components takes under 30 minutes because all modules already respect the data contract:",
        body_style
    ))

    integ_steps = [
        [Paragraph("Step", table_header), Paragraph("Task Description", table_header), Paragraph("Owner", table_header)],
        [
            Paragraph("<b>1</b>", table_cell_bold),
            Paragraph("Launch <code>server/main.py</code> (FastAPI) which imports <code>ml_engine/predict.py</code> and <code>counseling_engine/advisor.py</code>.", table_cell),
            Paragraph("Member 1 & 2", table_cell)
        ],
        [
            Paragraph("<b>2</b>", table_cell_bold),
            Paragraph("Expose <code>GET /api/students</code> returning the dataset students formatted to <code>student_schema.json</code>.", table_cell),
            Paragraph("Member 1 & 2", table_cell)
        ],
        [
            Paragraph("<b>3</b>", table_cell_bold),
            Paragraph("In <code>frontend/js/app.js</code>, switch <code>fetch('mock_students.json')</code> to <code>fetch('http://localhost:8000/api/students')</code>.", table_cell),
            Paragraph("Member 3", table_cell)
        ],
        [
            Paragraph("<b>4</b>", table_cell_bold),
            Paragraph("Verify end-to-end flow: Table displays real predictions, charts reflect SHAP values, and modals show generated notes.", table_cell),
            Paragraph("All Members", table_cell)
        ]
    ]
    t_int = Table(integ_steps, colWidths=[35, 385, 84])
    t_int.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, CARD_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_int)
    story.append(Spacer(1, 12))

    # Section 6: Git Rules for Zero Clashes
    story.append(Paragraph("6. Git Collaboration Rules to Guarantee Zero Clashes", h1_style))
    story.append(Paragraph(
        "<b>Rule 1: Dedicated Git Branches</b> — Member 1 works on <code>feat/ml-model</code>, Member 2 on <code>feat/counseling</code>, Member 3 on <code>feat/frontend</code>.<br/>"
        "<b>Rule 2: Directory Isolation</b> — Never commit changes to another member's folder. If you need a change, request an update to the schema.<br/>"
        "<b>Rule 3: Ignore Heavy Artifacts</b> — Ensure <code>.gitignore</code> includes <code>.venv/</code>, <code>__pycache__/</code>, and large CSV raw files.<br/>"
        "<b>Rule 4: Mock-First Independence</b> — If Member 1's training takes 3 days, Member 2 and 3 continue unimpeded using <code>mock_students.json</code>.",
        body_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == "__main__":
    build_pdf()
