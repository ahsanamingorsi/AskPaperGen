using AskPaperGen.Models.Schema;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Colors;
using iText.Layout.Borders;
using iText.Kernel.Font;
using iText.IO.Font.Constants;
using iText.IO.Image;

namespace AskPaperGen.Services;

public interface IPdfService { byte[] Generate(PaperDocument doc); }

public class PdfService : IPdfService
{
    public byte[] Generate(PaperDocument doc)
    {
        using var ms     = new MemoryStream();
        using var writer = new PdfWriter(ms);
        using var pdf    = new PdfDocument(writer);
        var pageSize = doc.Design.PaperSize == "Letter" ? iText.Kernel.Geom.PageSize.LETTER : iText.Kernel.Geom.PageSize.A4;
        using var layout = new Document(pdf, pageSize);
        layout.SetMargins(50, 48, 50, 48);

        var bold    = PdfFontFactory.CreateFont(StandardFonts.TIMES_BOLD);
        var regular = PdfFontFactory.CreateFont(StandardFonts.TIMES_ROMAN);
        var italic  = PdfFontFactory.CreateFont(StandardFonts.TIMES_ITALIC);
        var primary = HexColor(doc.Design.PrimaryColor, new DeviceRgb(30,58,138));

        BuildHeader(layout, doc, bold, regular, primary);
        BuildMeta(layout, doc.Info, bold, regular);
        BuildInstructions(layout, doc, regular, italic, primary);

        int qNum = 1;
        foreach (var sec in doc.Sections.OrderBy(s=>s.Order))
        {
            BuildSection(layout, sec, ref qNum, bold, regular, italic, primary, doc.Design);
        }

        layout.Close();
        return ms.ToArray();
    }

    private static void BuildHeader(Document d, PaperDocument doc, PdfFont bold, PdfFont reg, Color primary)
    {
        var i  = doc.Info;
        var hs = doc.Design.HeaderStyle;

        // Logo
        if (!string.IsNullOrEmpty(i.LogoBase64))
            try {
                var img = new iText.Layout.Element.Image(ImageDataFactory.Create(Convert.FromBase64String(i.LogoBase64)))
                    .SetMaxHeight(48).SetMaxWidth(100).SetHorizontalAlignment(HorizontalAlignment.CENTER).SetMarginBottom(5);
                d.Add(img);
            } catch {}

        if (hs == "band") {
            if (!string.IsNullOrEmpty(i.Institute))
                d.Add(new Paragraph(i.Institute).SetFont(bold).SetFontSize(14).SetFontColor(primary).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(2));
            if (!string.IsNullOrEmpty(i.Affiliation))
                d.Add(new Paragraph(i.Affiliation).SetFont(reg).SetFontSize(9).SetFontColor(Gray()).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(2));
            if (!string.IsNullOrEmpty(i.Department))
                d.Add(new Paragraph(i.Department).SetFont(reg).SetFontSize(10).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(4));
            if (!string.IsNullOrEmpty(i.ExamType))
                d.Add(new Paragraph((i.ExamType+" EXAMINATION").ToUpperInvariant())
                    .SetFont(bold).SetFontSize(11).SetFontColor(ColorConstants.WHITE)
                    .SetBackgroundColor(primary).SetTextAlignment(TextAlignment.CENTER).SetPadding(6).SetMarginBottom(5));
        } else {
            if (!string.IsNullOrEmpty(i.Institute))
                d.Add(new Paragraph(i.Institute).SetFont(bold).SetFontSize(14).SetFontColor(primary).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(2));
            if (!string.IsNullOrEmpty(i.Department))
                d.Add(new Paragraph(i.Department).SetFont(reg).SetFontSize(10).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(4));
            if (!string.IsNullOrEmpty(i.ExamType))
                d.Add(new Paragraph(i.ExamType.ToUpperInvariant()+" EXAMINATION").SetFont(bold).SetFontSize(11).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(5));
        }
        if (!string.IsNullOrEmpty(i.Subject))
            d.Add(new Paragraph($"Subject: {i.Subject}").SetFont(bold).SetFontSize(12).SetTextAlignment(TextAlignment.CENTER).SetMarginBottom(8));
        var sep = new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine(1.5f));
        sep.SetStrokeColor(primary); d.Add(sep); d.Add(new Paragraph("\n").SetFontSize(3));
    }

    private static void BuildMeta(Document d, PaperInfo i, PdfFont bold, PdfFont reg)
    {
        var t = new Table(UnitValue.CreatePercentArray(new float[]{1,1,1})).UseAllAvailableWidth().SetMarginBottom(10);
        void Cell(string label, string? val) {
            if (string.IsNullOrWhiteSpace(val)) return;
            var c = new Cell().SetBorder(Border.NO_BORDER).SetPadding(3);
            c.Add(new Paragraph(label).SetFont(reg).SetFontSize(8).SetFontColor(Gray()));
            c.Add(new Paragraph(val).SetFont(bold).SetFontSize(9));
            t.AddCell(c);
        }
        Cell("Total Marks", i.TotalMarks.ToString());
        Cell("Duration", i.Duration);
        Cell("Date", i.Date);
        if (!string.IsNullOrEmpty(i.Course)) Cell("Course", i.Course);
        if (!string.IsNullOrEmpty(i.AcademicYear)) Cell("Academic Year", i.AcademicYear);
        if (!string.IsNullOrEmpty(i.Grade)) Cell("Grade/Class", i.Grade);
        d.Add(t);
        d.Add(new Paragraph("Name: _______________________________    Roll No: ___________    Marks: _______")
            .SetFont(reg).SetFontSize(10).SetMarginBottom(10));
        var sep2 = new LineSeparator(new iText.Kernel.Pdf.Canvas.Draw.SolidLine(.7f));
        sep2.SetStrokeColor(Gray()); d.Add(sep2); d.Add(new Paragraph("\n").SetFontSize(4));
    }

    private static void BuildInstructions(Document d, PaperDocument doc, PdfFont reg, PdfFont italic, Color primary)
    {
        if (!doc.ShowInstructions || !doc.Instructions.Any()) return;
        var t = new Table(1).UseAllAvailableWidth().SetMarginBottom(12);
        var hdr = new Cell().SetBorder(Border.NO_BORDER).SetBorderLeft(new SolidBorder(primary, 4))
            .SetBackgroundColor(new DeviceRgb(239,246,255)).SetPadding(8);
        hdr.Add(
            new Paragraph("General Instructions")
                .SetFont(italic)
                .SetFontSize(9)
                .SetFontColor(primary)
        );
        var list = new List().SetFont(reg).SetFontSize(9).SetSymbolIndent(12).SetListSymbol("•");
        foreach (var ln in doc.Instructions) list.Add(new ListItem(ln));
        hdr.Add(list); t.AddCell(hdr); d.Add(t);
    }

    private static void BuildSection(Document d, PaperSection sec, ref int qNum, PdfFont bold, PdfFont reg, PdfFont italic, Color primary, PaperDesign design)
    {
        var ss = design.SectionStyle;
        if (ss == "band")
            d.Add(new Paragraph(sec.Title.ToUpperInvariant()).SetFont(bold).SetFontSize(10).SetFontColor(ColorConstants.WHITE).SetBackgroundColor(primary).SetPadding(5).SetMarginBottom(4));
        else
            d.Add(new Paragraph(sec.Title.ToUpperInvariant()).SetFont(bold).SetFontSize(10).SetFontColor(primary).SetBorderBottom(new SolidBorder(primary,1.5f)).SetPaddingBottom(3).SetMarginBottom(4));

        if (!string.IsNullOrEmpty(sec.AttemptRule))
            d.Add(new Paragraph(sec.AttemptRule)
                .SetFont(italic)
                .SetFontSize(9)
                .SetFontColor(Gray())
                .SetMarginBottom(3));

        if (!string.IsNullOrEmpty(sec.Instructions))
            d.Add(new Paragraph(sec.Instructions)
                .SetFont(italic)
                .SetFontSize(9)
                .SetFontColor(Gray())
                .SetMarginBottom(6));

        foreach (var q in sec.Questions.OrderBy(q=>q.Order))
        {
            BuildQuestion(d, q, qNum++, sec.DefaultMarks, bold, reg, primary, design);
        }
        d.Add(new Paragraph("\n").SetFontSize(4));
    }

    private static void BuildQuestion(Document d, PaperQuestion q, int num, int defMarks, PdfFont bold, PdfFont reg, Color primary, PaperDesign design)
    {
        int marks = q.Marks > 0 ? q.Marks : defMarks;
        var p = new Paragraph().SetFont(reg).SetFontSize(10).SetMarginBottom(4);
        p.Add(new Text($"Q{num}.  ").SetFont(bold));
        p.Add(new Text(q.Text));
        if (design.ShowMarks) p.Add(new Text($"  [{marks} mark{(marks!=1?"s":"")}]").SetFontColor(Gray()).SetFontSize(8));
        d.Add(p);

        if (!string.IsNullOrEmpty(q.ImageBase64))
            try {
                var img = new iText.Layout.Element.Image(ImageDataFactory.Create(Convert.FromBase64String(q.ImageBase64)))
                    .SetMaxWidth(260).SetMaxHeight(160).SetMarginLeft(20).SetMarginBottom(6);
                d.Add(img);
            } catch {}

        switch (q.Type) {
            case 3 when q.Options is not null:
                var t = new Table(UnitValue.CreatePercentArray(new float[]{1,1})).UseAllAvailableWidth().SetMarginLeft(20).SetMarginBottom(6);
                void Opt(string lbl, string val) {
                    var c = new Cell().SetBorder(Border.NO_BORDER).SetPaddingTop(1).SetPaddingBottom(1);
                    c.Add(new Paragraph($"({lbl})  {val}").SetFont(reg).SetFontSize(10)); t.AddCell(c);
                }
                Opt("A",q.Options.A); Opt("B",q.Options.B); Opt("C",q.Options.C); Opt("D",q.Options.D);
                d.Add(t); break;
            case 5:
                d.Add(new Paragraph("  ").SetFontSize(12).SetBorderBottom(new SolidBorder(Gray(),.6f)).SetMarginBottom(4).SetMarginLeft(20));
                break;
            case 6:
                var tfP = new Paragraph().SetFont(reg).SetFontSize(10).SetMarginLeft(20).SetMarginBottom(4);
                tfP.Add("☐ True        ☐ False"); d.Add(tfP); break;
            default:
                if (design.ShowAnswerLines) {
                    int lines = q.AnswerLines ?? (q.Type==2 ? 7 : 3);
                    for (int l=0;l<lines;l++)
                        d.Add(new Paragraph("  ").SetFontSize(12).SetBorderBottom(new SolidBorder(new DeviceRgb(210,214,220),.5f)).SetMarginBottom(3));
                }
                break;
        }
        d.Add(new Paragraph("\n").SetFontSize(2));
    }

    private static Color HexColor(string hex, Color fallback) {
        try { hex=hex.TrimStart('#'); return new DeviceRgb(Convert.ToInt32(hex[..2],16),Convert.ToInt32(hex[2..4],16),Convert.ToInt32(hex[4..6],16)); }
        catch { return fallback; }
    }
    private static Color Gray() => new DeviceRgb(100,116,139);
}
