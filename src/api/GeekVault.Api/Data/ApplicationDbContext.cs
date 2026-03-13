using GeekVault.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GeekVault.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<CollectionType> CollectionTypes => Set<CollectionType>();
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    public DbSet<OwnedCopy> OwnedCopies => Set<OwnedCopy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CollectionType>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Icon).HasMaxLength(100);
            entity.OwnsMany(e => e.CustomFieldSchema, b =>
            {
                b.ToJson();
            });
        });

        modelBuilder.Entity<Collection>(entity =>
        {
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
    }
}
