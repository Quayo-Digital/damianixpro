
import { DocumentCategory, documentCategories } from "@/services/documents";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldsProps {
  name: string;
  setName: (name: string) => void;
  category: DocumentCategory | "";
  setCategory: (category: DocumentCategory | "") => void;
  description: string;
  setDescription: (description: string) => void;
  property: string;
  setProperty: (property: string) => void;
  tags: string;
  setTags: (tags: string) => void;
  properties?: { id: string; name: string }[];
}

export function FormFields({
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
  property,
  setProperty,
  tags,
  setTags,
  properties,
}: FormFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="document-name">Name</Label>
        <Input
          id="document-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="document-category">Category</Label>
        <Select value={category} onValueChange={(value) => setCategory(value as DocumentCategory)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {documentCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {properties && properties.length > 0 && (
        <div className="grid gap-2">
          <Label htmlFor="document-property">Property (Optional)</Label>
          <Select value={property} onValueChange={setProperty}>
            <SelectTrigger>
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="grid gap-2">
        <Label htmlFor="document-description">Description (Optional)</Label>
        <Textarea
          id="document-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="document-tags">Tags (Optional)</Label>
        <Input
          id="document-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Comma separated tags"
        />
        <p className="text-xs text-muted-foreground">
          E.g. lease, 2023, active
        </p>
      </div>
    </>
  );
}
