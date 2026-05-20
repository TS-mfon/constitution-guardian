import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAdoptTemplate, useRegisterTemplate, useTemplates } from "@/hooks/useConstitutionalDAO";

export default function StandardsPage() {
  const { data: templates = [] } = useTemplates();
  const registerTemplate = useRegisterTemplate();
  const adoptTemplate = useAdoptTemplate();

  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [tags, setTags] = useState("");
  const [rationale, setRationale] = useState("");

  return (
    <div className="space-y-8">
      <section className="stage-grid">
        <div className="col-span-12 editorial-panel lg:col-span-5">
          <div className="editorial-chip">Cross-DAO Standards</div>
          <h1 className="mt-5 text-4xl leading-none">A library of battle-tested constitutional templates.</h1>
          <p className="mt-6 text-sm leading-7 text-muted-foreground">
            Instead of rewriting governance from scratch, new DAOs can adopt proven frameworks and keep a transparent
            lineage of how their active charter evolved.
          </p>
        </div>

        <div className="col-span-12 editorial-panel lg:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Registry</p>
              <h2 className="mt-2 text-2xl">Publish a new template</h2>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full">Register template</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Register constitutional template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Template name" />
                  <Input value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Short summary" />
                  <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Comma-separated tags" />
                  <Textarea
                    className="min-h-[220px]"
                    value={templateText}
                    onChange={(event) => setTemplateText(event.target.value)}
                    placeholder="Full constitutional template"
                  />
                  <Button
                    className="rounded-full"
                    disabled={registerTemplate.isPending || name.length < 3 || templateText.length < 50}
                    onClick={() =>
                      registerTemplate.mutate({
                        name,
                        summary,
                        templateText,
                        tagsJson: JSON.stringify(tags.split(",").map((tag) => tag.trim()).filter(Boolean)),
                      })
                    }
                  >
                    {registerTemplate.isPending ? "Registering..." : "Register"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {templates.map((template, index) => (
          <article
            key={template.template_id}
            className="editorial-panel"
            style={{ marginTop: index % 2 === 0 ? "0" : "1.5rem" }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{template.template_id}</p>
                <h2 className="mt-3 text-2xl">{template.name}</h2>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={adoptTemplate.isPending}
                onClick={() => adoptTemplate.mutate({ templateId: template.template_id, rationale: rationale || `Adopt ${template.name}` })}
              >
                Adopt
              </Button>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{template.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span key={tag} className="editorial-chip">{tag}</span>
              ))}
            </div>
            <Textarea
              className="mt-5 min-h-[120px]"
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Optional rationale for adoption"
            />
            <pre className="mt-5 max-h-[220px] overflow-auto whitespace-pre-wrap text-sm leading-7 text-foreground/80">
              {template.template_text}
            </pre>
          </article>
        ))}
      </section>
    </div>
  );
}
