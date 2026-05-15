namespace AskPaperGen.Models.Schema;

public class PaperDocument
{
    public string SchemaVersion   { get; set; } = "3.0";
    public PaperInfo     Info     { get; set; } = new();
    public PaperDesign   Design   { get; set; } = new();
    public List<string>  Instructions { get; set; } = [
        "All questions are compulsory unless otherwise stated.",
        "Write legibly in the space provided.",
        "Use of mobile phones is strictly prohibited."
    ];
    public bool ShowInstructions  { get; set; } = true;
    public List<PaperSection> Sections { get; set; } = [];
}

public class PaperInfo
{
    public string  Institute    { get; set; } = string.Empty;
    public string? Affiliation  { get; set; }
    public string? Department   { get; set; }
    public string  Subject      { get; set; } = string.Empty;
    public string? SubjectCode  { get; set; }
    public string  ExamType     { get; set; } = string.Empty;
    public string  Duration     { get; set; } = string.Empty;
    public int     TotalMarks   { get; set; }
    public string? Date         { get; set; }
    public string? AcademicYear { get; set; }
    public string? Course       { get; set; }
    public string? Grade        { get; set; }
    public string? InstructorName { get; set; }
    public string? PaperCode    { get; set; }
    public string  Language     { get; set; } = "English";
    public string? LogoBase64   { get; set; }
    public string? LogoMimeType { get; set; }
}

public class PaperDesign
{
    public string PrimaryColor   { get; set; } = "#1e3a8a";
    public string HeaderStyle    { get; set; } = "band";
    public string SectionStyle   { get; set; } = "sidebar";
    public string FontFamily     { get; set; } = "times";
    public float  FontSize       { get; set; } = 11f;
    public string PaperSize      { get; set; } = "A4";
    public bool   Rtl            { get; set; } = false;
    public bool   ShowAnswerLines{ get; set; } = true;
    public bool   ShowMarks      { get; set; } = true;
    public bool   ShowPageNums   { get; set; } = true;
}

public class PaperSection
{
    public string Id            { get; set; } = Guid.NewGuid().ToString("N");
    public string Title         { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string? AttemptRule  { get; set; }
    public int     DefaultMarks { get; set; } = 1;
    public string  QuestionType { get; set; } = "mixed";
    public int     Order        { get; set; }
    public List<PaperQuestion> Questions { get; set; } = [];
}

public class PaperQuestion
{
    public string Id          { get; set; } = Guid.NewGuid().ToString("N");
    public int    Type        { get; set; } = 1; // 1=Short 2=Long 3=MCQ 5=Fill 6=TF
    public string Text        { get; set; } = string.Empty;
    public string? UrduText   { get; set; }
    public int    Marks       { get; set; }
    public int?   AnswerLines { get; set; }
    public int    Order       { get; set; }
    public string? ImageBase64   { get; set; }
    public string? ImageMimeType { get; set; }
    public McqOptions? Options   { get; set; }
}

public class McqOptions
{
    public string A { get; set; } = string.Empty;
    public string B { get; set; } = string.Empty;
    public string C { get; set; } = string.Empty;
    public string D { get; set; } = string.Empty;
    public string? CorrectAnswer { get; set; }
}

// ── Template settings JSON schema ─────────────────────────────
public class TemplateSettings
{
    public string  PrimaryColor     { get; set; } = "#1e3a8a";
    public string  HeaderStyle      { get; set; } = "band";
    public string  SectionStyle     { get; set; } = "sidebar";
    public string  FontFamily       { get; set; } = "times";
    public float   FontSize         { get; set; } = 11f;
    public string  PaperSize        { get; set; } = "A4";
    public bool    Rtl              { get; set; } = false;
    public bool    ShowLogo         { get; set; } = true;
    public bool    ShowAnswerLines  { get; set; } = true;
    public bool    ShowMarks        { get; set; } = true;
    public bool    ShowPageNums     { get; set; } = true;
    public bool    ShowInstructions { get; set; } = true;
    public List<string> DefaultInstructions  { get; set; } = [];
    public List<SectionPreset> SectionPresets{ get; set; } = [];

    // Header element order (admin-controlled)
    public List<string> HeaderElements { get; set; } = ["logo","institute","affiliation","department","examBand","subject","meta","divider","nameRow"];
}

public class SectionPreset
{
    public string  Title        { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string? AttemptRule  { get; set; }
    public int     DefaultMarks { get; set; } = 1;
    public string  QuestionType { get; set; } = "mixed";
}
