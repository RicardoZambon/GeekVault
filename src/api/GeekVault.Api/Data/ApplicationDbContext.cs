using GeekVault.Api.Entities.Admin;
using GeekVault.Api.Entities.Security;
using GeekVault.Api.Entities.Vault;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Data;

public class ApplicationDbContext : IdentityDbContext<User, IdentityRole, string>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<CollectionType> CollectionTypes => Set<CollectionType>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    public DbSet<OwnedCopy> OwnedCopies => Set<OwnedCopy>();
    public DbSet<Set> Sets => Set<Set>();
    public DbSet<SetItem> SetItems => Set<SetItem>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Exclude unused Identity tables (claims, logins, tokens)
        modelBuilder.Entity<IdentityUserClaim<string>>().ToTable(t => t.ExcludeFromMigrations());
        modelBuilder.Entity<IdentityUserLogin<string>>().ToTable(t => t.ExcludeFromMigrations());
        modelBuilder.Entity<IdentityUserToken<string>>().ToTable(t => t.ExcludeFromMigrations());

        // Configure role tables under Security schema
        modelBuilder.Entity<IdentityRole>(entity =>
        {
            entity.ToTable("Roles", "Security");
        });

        modelBuilder.Entity<IdentityUserRole<string>>(entity =>
        {
            entity.ToTable("UserRoles", "Security");
        });

        modelBuilder.Entity<IdentityRoleClaim<string>>(entity =>
        {
            entity.ToTable(t => t.ExcludeFromMigrations());
        });

        // Configure Users table under Security schema
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", "Security");
        });

        modelBuilder.Entity<CollectionType>(entity =>
        {
            entity.ToTable("CollectionTypes", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.OwnsMany(e => e.CustomFieldSchema, b =>
            {
                b.ToJson();
            });
        });

        modelBuilder.Entity<Collection>(entity =>
        {
            entity.ToTable("Collections", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.CoverImage).HasMaxLength(500);
            entity.Property(e => e.Visibility)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CollectionType)
                .WithMany()
                .HasForeignKey(e => e.CollectionTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CatalogItem>(entity =>
        {
            entity.ToTable("CatalogItems", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Identifier).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.Manufacturer).HasMaxLength(200);
            entity.Property(e => e.ReferenceCode).HasMaxLength(200);
            entity.Property(e => e.Image).HasMaxLength(500);
            entity.Property(e => e.Rarity).HasMaxLength(100);
            entity.HasOne(e => e.Collection)
                .WithMany()
                .HasForeignKey(e => e.CollectionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.OwnsMany(e => e.CustomFieldValues, b =>
            {
                b.ToJson();
            });
        });

        modelBuilder.Entity<OwnedCopy>(entity =>
        {
            entity.ToTable("OwnedCopies", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Condition)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.Property(e => e.PurchasePrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.EstimatedValue).HasColumnType("decimal(18,2)");
            entity.Property(e => e.AcquisitionSource).HasMaxLength(500);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasOne(e => e.CatalogItem)
                .WithMany()
                .HasForeignKey(e => e.CatalogItemId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.OwnsMany(e => e.Images, b =>
            {
                b.ToJson();
            });
        });

        modelBuilder.Entity<Set>(entity =>
        {
            entity.ToTable("Sets", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(e => e.Collection)
                .WithMany()
                .HasForeignKey(e => e.CollectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SetItem>(entity =>
        {
            entity.ToTable("SetItems", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasOne(e => e.Set)
                .WithMany()
                .HasForeignKey(e => e.SetId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CatalogItem)
                .WithMany()
                .HasForeignKey(e => e.CatalogItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WishlistItem>(entity =>
        {
            entity.ToTable("WishlistItems", "Vault");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TargetPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasOne(e => e.Collection)
                .WithMany()
                .HasForeignKey(e => e.CollectionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.CatalogItem)
                .WithMany()
                .HasForeignKey(e => e.CatalogItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLogs", "Audit");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
            entity.Property(e => e.TargetType).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TargetId).HasMaxLength(200);
            entity.Property(e => e.Details).HasMaxLength(4000);
            entity.Property(e => e.IpAddress).HasMaxLength(45);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Timestamp);
            entity.HasIndex(e => e.Action);
        });
    }
}
