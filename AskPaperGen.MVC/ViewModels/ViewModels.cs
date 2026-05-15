using System.ComponentModel.DataAnnotations;

namespace AskPaperGen.ViewModels;

public class LoginVm {
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, DataType(DataType.Password)] public string Password { get; set; } = "";
    public bool RememberMe { get; set; }
}
public class RegisterVm {
    [Required, MaxLength(120)] public string FullName { get; set; } = "";
    [Required, EmailAddress]   public string Email    { get; set; } = "";
    [MaxLength(200)] public string? Institution { get; set; }
    [Required, MinLength(6), DataType(DataType.Password)] public string Password { get; set; } = "";
    [Required, Compare(nameof(Password)), DataType(DataType.Password)] public string ConfirmPassword { get; set; } = "";
}
public class DashboardVm {
    public string  UserName        { get; set; } = "";
    public string? UserInitials    { get; set; }
    public string? Institution     { get; set; }
    public int     TotalTemplates  { get; set; }
    public bool    SaveDisabled    { get; set; }
    public string  SaveDisabledMsg { get; set; } = "";
    public List<TemplateListItem> AllTemplates { get; set; } = [];
}
public class TemplateListItem {
    public int     Id             { get; set; }
    public string  Name           { get; set; } = "";
    public string? Description    { get; set; }
    public string? Category       { get; set; }
    public string? Language       { get; set; }
    public string? ThumbnailClass { get; set; }
    public bool    IsBuiltIn      { get; set; }
    public bool    IsPublic       { get; set; }
    public string? OwnerName      { get; set; }
    public DateTime CreatedAt     { get; set; }
}
public class AdminDashVm {
    public int    TotalUsers      { get; set; }
    public int    TotalTemplates  { get; set; }
    public int    ActiveUsers     { get; set; }
    public bool   SaveDisabled    { get; set; }
    public string SaveDisabledMsg { get; set; } = "";
    public List<UserListItem> RecentUsers { get; set; } = [];
}
public class UserListItem {
    public string  Id          { get; set; } = "";
    public string  FullName    { get; set; } = "";
    public string  Email       { get; set; } = "";
    public string? Institution { get; set; }
    public bool    IsActive    { get; set; }
    public DateTime CreatedAt  { get; set; }
    public string? Initials    { get; set; }
}
public class TemplateBuilderVm {
    public int     Id           { get; set; }
    public string  Name         { get; set; } = "";
    public string? Description  { get; set; }
    public string? Category     { get; set; }
    public string? Subject      { get; set; }
    public string  Language     { get; set; } = "English";
    public bool    IsPublic     { get; set; }
    public string  SettingsJson { get; set; } = "{}";
}
public class SaveTemplateRequest {
    public int     Id           { get; set; }
    public string  Name         { get; set; } = "";
    public string? Description  { get; set; }
    public string? Category     { get; set; }
    public string? Subject      { get; set; }
    public string? Language     { get; set; }
    public bool    IsPublic     { get; set; }
    public string  SettingsJson { get; set; } = "{}";
}
